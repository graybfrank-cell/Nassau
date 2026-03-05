import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { renderBaseEmail } from "@/emails/BaseEmail";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { ONBOARDING_AGENT_PROMPT } from "@/lib/marketing-prompts";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all active onboarding sequences (signed up in last 7 days, not completed)
    const { data: sequences, error: seqError } = await supabase
      .from("onboarding_sequences")
      .select("*")
      .eq("completed", false)
      .gte("signup_date", sevenDaysAgo);

    if (seqError) {
      console.error("[onboarding] Error fetching sequences:", seqError);
      return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 });
    }

    let day0Sent = 0;
    let day3Sent = 0;
    let day7Sent = 0;
    let completions = 0;

    for (const seq of sequences || []) {
      // Check if user has created a trip or round
      const { count: tripCount } = await supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("created_by", seq.user_id);

      const { count: roundCount } = await supabase
        .from("rounds")
        .select("id", { count: "exact", head: true })
        .eq("created_by", seq.user_id);

      if ((tripCount || 0) > 0 || (roundCount || 0) > 0) {
        // User has engaged — mark completed
        await supabase
          .from("onboarding_sequences")
          .update({ completed: true, completed_at: now.toISOString() })
          .eq("id", seq.id);
        completions++;
        continue;
      }

      const signupDate = new Date(seq.signup_date);

      // Day 0: send if not sent (edge case for users missed by webhook)
      if (!seq.day0_sent) {
        const emailContent = await generateEmail(seq, 0);
        await sendOnboardingEmail(seq.email, emailContent, "Create your first trip", "https://nassau.golf/trips/new");
        await supabase
          .from("onboarding_sequences")
          .update({ day0_sent: true, day0_sent_at: now.toISOString() })
          .eq("id", seq.id);
        day0Sent++;
      }

      // Day 3: send if 3+ days since signup and not sent
      if (!seq.day3_sent && signupDate <= new Date(threeDaysAgo)) {
        const emailContent = await generateEmail(seq, 3);
        await sendOnboardingEmail(seq.email, emailContent, "Plan a trip", "https://nassau.golf/trips/new");
        await supabase
          .from("onboarding_sequences")
          .update({ day3_sent: true, day3_sent_at: now.toISOString() })
          .eq("id", seq.id);
        day3Sent++;
      }

      // Day 7: send if 7+ days since signup and not sent
      if (!seq.day7_sent && signupDate <= new Date(sevenDaysAgo)) {
        const emailContent = await generateEmail(seq, 7);
        await sendOnboardingEmail(seq.email, emailContent, "Try Nassau bets", "https://nassau.golf/rounds/new");
        await supabase
          .from("onboarding_sequences")
          .update({ day7_sent: true, day7_sent_at: now.toISOString() })
          .eq("id", seq.id);
        day7Sent++;
      }
    }

    // Log to marketing_performance
    await supabase.from("marketing_performance").insert({
      metric_date: now.toISOString().split("T")[0],
      platform: "email",
      pillar: "onboarding",
      format: "onboarding",
      impressions: (sequences || []).length,
      likes: day0Sent + day3Sent + day7Sent,
      comments: completions,
      shares: 0,
      saves: 0,
      link_clicks: 0,
    });

    return NextResponse.json({
      success: true,
      processed: (sequences || []).length,
      day0_sent: day0Sent,
      day3_sent: day3Sent,
      day7_sent: day7Sent,
      completions,
    });
  } catch (error) {
    console.error("[onboarding] Error:", error);
    return NextResponse.json({ error: "Onboarding agent failed" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateEmail(seq: any, day: number) {
  const userContext = `User email: ${seq.email}. Day: ${day}. ${day === 3 ? "They haven't created a trip or round yet. Subject: 'Your crew is waiting on you'." : ""} ${day === 7 ? "Still no trip or round after a week. Subject: 'Quick tip from the Nassau team'. Include a tip about setting up a Nassau bet." : ""}`;

  try {
    const response = await callClaude({
      system: ONBOARDING_AGENT_PROMPT,
      messages: [{ role: "user", content: userContext }],
    });
    return extractJSON(response) as { subject: string; preview_text: string; body_html: string; body_text: string };
  } catch {
    // Fallback emails per day
    const fallbacks: Record<number, { subject: string; preview_text: string; body_html: string }> = {
      0: {
        subject: "Welcome to Nassau — your golf trips just got easier",
        preview_text: "Plan trips. Track rounds. Settle bets.",
        body_html: "<p>Welcome to Nassau. Plan your first golf trip or track a round — it takes about 60 seconds.</p>",
      },
      3: {
        subject: "Your crew is waiting on you",
        preview_text: "Thousands of golfers are already planning trips on Nassau",
        body_html: "<p>Golf trips are better when everyone's on the same page. Nassau keeps your crew organized — from tee times to settle-up.</p><p>Create your first trip and invite your guys.</p>",
      },
      7: {
        subject: "Quick tip from the Nassau team",
        preview_text: "Did you know you can track Nassau bets in the app?",
        body_html: "<p>Quick tip: next time you play a Nassau bet, use the app to track presses and auto-calculate payouts. No more napkin math at the 19th hole.</p>",
      },
    };
    return fallbacks[day] || fallbacks[0];
  }
}

async function sendOnboardingEmail(
  to: string,
  content: { subject: string; preview_text?: string; body_html: string },
  ctaText: string,
  ctaUrl: string
) {
  try {
    await resend.emails.send({
      from: "Nassau <hey@nassau.golf>",
      to,
      subject: content.subject,
      html: renderBaseEmail({
        previewText: content.preview_text,
        bodyHtml: content.body_html,
        ctaText,
        ctaUrl,
      }),
    });
  } catch (error) {
    console.error(`[onboarding] Failed to send email to ${to}:`, error);
  }
}

// GET endpoint for fetching stats
export async function GET() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    const { count: totalInSequence } = await supabase
      .from("onboarding_sequences")
      .select("id", { count: "exact", head: true });

    const { count: day0Count } = await supabase
      .from("onboarding_sequences")
      .select("id", { count: "exact", head: true })
      .eq("day0_sent", true);

    const { count: day3Count } = await supabase
      .from("onboarding_sequences")
      .select("id", { count: "exact", head: true })
      .eq("day3_sent", true);

    const { count: day7Count } = await supabase
      .from("onboarding_sequences")
      .select("id", { count: "exact", head: true })
      .eq("day7_sent", true);

    const { count: completedCount } = await supabase
      .from("onboarding_sequences")
      .select("id", { count: "exact", head: true })
      .eq("completed", true);

    return NextResponse.json({
      total_in_sequence: totalInSequence || 0,
      day0_sent: day0Count || 0,
      day3_sent: day3Count || 0,
      day7_sent: day7Count || 0,
      completed: completedCount || 0,
      completion_rate: totalInSequence ? Math.round(((completedCount || 0) / totalInSequence) * 100) : 0,
    });
  } catch (error) {
    console.error("[onboarding] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
