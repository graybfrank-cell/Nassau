import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { renderBaseEmail } from "@/emails/BaseEmail";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { REACTIVATION_AGENT_PROMPT } from "@/lib/marketing-prompts";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Get completed onboarding users
    const { data: completedUsers, error: compError } = await supabase
      .from("onboarding_sequences")
      .select("user_id, email")
      .eq("completed", true);

    if (compError) {
      console.error("[reactivation] Error fetching completed users:", compError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    let emailsSent = 0;
    let churnedCount = 0;

    for (const user of completedUsers || []) {
      // Get last activity
      const { data: lastTrip } = await supabase
        .from("trips")
        .select("id, created_at, destination")
        .eq("created_by", user.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: lastRound } = await supabase
        .from("rounds")
        .select("id, created_at, course_name")
        .eq("created_by", user.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Determine last activity date and action
      let lastActiveAt: string | null = null;
      let lastAction = "signed up";

      if (lastTrip && lastRound) {
        if (lastTrip.created_at > lastRound.created_at) {
          lastActiveAt = lastTrip.created_at;
          lastAction = `created a trip to ${lastTrip.destination || "a destination"}`;
        } else {
          lastActiveAt = lastRound.created_at;
          lastAction = `played a round at ${lastRound.course_name || "a course"}`;
        }
      } else if (lastTrip) {
        lastActiveAt = lastTrip.created_at;
        lastAction = `created a trip to ${lastTrip.destination || "a destination"}`;
      } else if (lastRound) {
        lastActiveAt = lastRound.created_at;
        lastAction = `played a round at ${lastRound.course_name || "a course"}`;
      }

      if (!lastActiveAt) continue;

      const lastActive = new Date(lastActiveAt);
      const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      // Skip if active in last 30 days
      if (daysSinceActive < 30) continue;

      // Check if reactivation email already sent in last 60 days
      const { data: recentEmail } = await supabase
        .from("reactivation_log")
        .select("id")
        .eq("user_id", user.user_id)
        .gte("email_sent_at", sixtyDaysAgo)
        .limit(1)
        .single();

      if (recentEmail) {
        // Check if 60+ days dormant with no reactivation click → churn
        if (daysSinceActive >= 60) {
          const { data: existingLog } = await supabase
            .from("reactivation_log")
            .select("id, reactivated")
            .eq("user_id", user.user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (existingLog && !existingLog.reactivated) {
            await supabase
              .from("reactivation_log")
              .update({ churned: true })
              .eq("id", existingLog.id);
            churnedCount++;
          }
        }
        continue;
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.user_id)
        .single();

      const firstName = profile?.full_name?.split(" ")[0] || "";
      const currentMonth = now.toLocaleString("en-US", { month: "long" });

      // Generate personalized email via Claude
      const userContext = `First name: ${firstName || "Golfer"}. Last action: "${lastAction}". Days since last active: ${daysSinceActive}. Current month: ${currentMonth}. Season: ${getGolfSeason(now)}.`;

      let emailContent;
      try {
        const response = await callClaude({
          system: REACTIVATION_AGENT_PROMPT,
          messages: [{ role: "user", content: userContext }],
        });
        emailContent = extractJSON(response) as {
          subject: string;
          preview_text: string;
          body_html: string;
          body_text: string;
        };
      } catch {
        emailContent = {
          subject: `It's been a minute${firstName ? `, ${firstName}` : ""}`,
          preview_text: "Your crew might be planning without you",
          body_html: `<p style="margin:0 0 16px;">${firstName ? `Hey ${firstName},` : "Hey,"}</p>
            <p style="margin:0 0 16px;">Haven't seen you on Nassau in a while. ${currentMonth} is prime time to get a trip on the books — courses are in great shape and your crew is probably already texting about it.</p>
            <p style="margin:0;">Jump back in and see what's new.</p>`,
        };
      }

      // Send email
      try {
        await resend.emails.send({
          from: "Grayson at Nassau <grayson@nassau.golf>",
          replyTo: "grayson@nassau.golf",
          to: user.email,
          subject: emailContent.subject,
          html: renderBaseEmail({
            previewText: emailContent.preview_text,
            bodyHtml: emailContent.body_html,
            ctaText: "Jump back in",
            ctaUrl: "https://nassau.golf/dashboard",
          }),
        });
      } catch (emailError) {
        console.error(`[reactivation] Email failed for ${user.email}:`, emailError);
        continue;
      }

      // Log to reactivation_log
      await supabase.from("reactivation_log").insert({
        user_id: user.user_id,
        email: user.email,
        last_active_at: lastActiveAt,
        last_action: lastAction,
        email_sent_at: now.toISOString(),
        email_subject: emailContent.subject,
      });

      emailsSent++;
    }

    // Log to marketing_performance
    await supabase.from("marketing_performance").insert({
      metric_date: now.toISOString().split("T")[0],
      platform: "email",
      pillar: "reactivation",
      format: "reactivation",
      impressions: (completedUsers || []).length,
      likes: emailsSent,
      comments: churnedCount,
      shares: 0,
      saves: 0,
      link_clicks: 0,
    });

    return NextResponse.json({
      success: true,
      processed: (completedUsers || []).length,
      emails_sent: emailsSent,
      churned: churnedCount,
    });
  } catch (error) {
    console.error("[reactivation] Error:", error);
    return NextResponse.json({ error: "Reactivation agent failed" }, { status: 500 });
  }
}

function getGolfSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

// GET endpoint for stats
export async function GET() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: dormantCount } = await supabase
      .from("onboarding_sequences")
      .select("id", { count: "exact", head: true })
      .eq("completed", true);

    const { count: emailsThisMonth } = await supabase
      .from("reactivation_log")
      .select("id", { count: "exact", head: true })
      .gte("email_sent_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

    const { count: reactivatedCount } = await supabase
      .from("reactivation_log")
      .select("id", { count: "exact", head: true })
      .eq("reactivated", true);

    const { count: totalSent } = await supabase
      .from("reactivation_log")
      .select("id", { count: "exact", head: true });

    const { count: churnedCount } = await supabase
      .from("reactivation_log")
      .select("id", { count: "exact", head: true })
      .eq("churned", true);

    const { data: recentEmails } = await supabase
      .from("reactivation_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      dormant_users: dormantCount || 0,
      emails_this_month: emailsThisMonth || 0,
      reactivation_rate: totalSent ? Math.round(((reactivatedCount || 0) / totalSent) * 100) : 0,
      churned_users: churnedCount || 0,
      recent_emails: recentEmails || [],
    });
  } catch (error) {
    console.error("[reactivation] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
