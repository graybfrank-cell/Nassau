import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { renderBaseEmail } from "@/emails/BaseEmail";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { ONBOARDING_AGENT_PROMPT } from "@/lib/marketing-prompts";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Supabase Auth webhook payload
    const { type, record } = body;

    if (type !== "INSERT" || !record) {
      return NextResponse.json({ ok: true });
    }

    const userId = record.id;
    const email = record.email;

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // --- Referral tracking ---
    // Check for referral code in the webhook metadata or headers
    const referralCode =
      record.raw_user_meta_data?.referral_code ||
      req.headers.get("x-nassau-referral-code");

    if (referralCode) {
      const { data: referrer } = await supabase
        .from("referral_codes")
        .select("user_id")
        .eq("code", referralCode)
        .single();

      if (referrer) {
        await supabase.from("referrals").insert({
          referrer_id: referrer.user_id,
          referred_id: userId,
          referral_code: referralCode,
        });

        // Send confirmation emails to both users
        const { data: referrerProfile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", referrer.user_id)
          .single();

        if (referrerProfile?.email) {
          try {
            await resend.emails.send({
              from: "Nassau <hey@nassau.golf>",
              to: referrerProfile.email,
              subject: "Your friend just joined Nassau!",
              html: renderBaseEmail({
                previewText: "Your referral link is working",
                bodyHtml: `<p style="margin:0 0 16px;">Hey${referrerProfile.full_name ? ` ${referrerProfile.full_name.split(" ")[0]}` : ""},</p>
                  <p style="margin:0 0 16px;">Good news — someone just signed up for Nassau using your referral link. Your crew is growing.</p>
                  <p style="margin:0;">Keep sharing and we'll keep track. More friends = more golf.</p>`,
                ctaText: "See your referrals",
                ctaUrl: "https://nassau.golf/dashboard",
              }),
            });
          } catch (emailError) {
            console.error("[user-signup] Referrer email failed:", emailError);
          }
        }
      }
    }

    // --- Onboarding sequence ---
    // Check if onboarding record already exists
    const { data: existingSeq } = await supabase
      .from("onboarding_sequences")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingSeq) {
      return NextResponse.json({ ok: true, message: "Already enrolled" });
    }

    // Generate Day 0 email via Claude
    const userName = record.raw_user_meta_data?.full_name?.split(" ")[0] || "";
    const userContext = `User name: ${userName || "unknown"}. Email: ${email}. Signup source: ${record.raw_user_meta_data?.provider || "direct"}. Day: 0 (welcome email).`;

    let emailContent;
    try {
      const response = await callClaude({
        system: ONBOARDING_AGENT_PROMPT,
        messages: [{ role: "user", content: userContext }],
      });
      emailContent = extractJSON(response) as {
        subject: string;
        preview_text: string;
        body_html: string;
        body_text: string;
      };
    } catch {
      // Fallback to default welcome email
      emailContent = {
        subject: "Welcome to Nassau — your golf trips just got easier",
        preview_text: "Plan trips. Track rounds. Settle bets.",
        body_html: `<p style="margin:0 0 16px;">${userName ? `Hey ${userName},` : "Hey,"}</p>
          <p style="margin:0 0 16px;">Welcome to Nassau. We built this because planning a golf trip with your crew shouldn't require a 47-text group chat and a shared spreadsheet nobody updates.</p>
          <p style="margin:0 0 16px;">Nassau lets you plan trips, track rounds, and settle bets — all in one place. The way it should be.</p>
          <p style="margin:0;">Get started by creating your first trip or tracking a round.</p>`,
        body_text: "Welcome to Nassau. Plan your first trip or track a round at nassau.golf.",
      };
    }

    // Send Day 0 email
    try {
      await resend.emails.send({
        from: "Nassau <hey@nassau.golf>",
        to: email,
        subject: emailContent.subject,
        html: renderBaseEmail({
          previewText: emailContent.preview_text,
          bodyHtml: emailContent.body_html,
          ctaText: "Create your first trip",
          ctaUrl: "https://nassau.golf/trips/new",
        }),
      });
    } catch (emailError) {
      console.error("[user-signup] Day 0 email failed:", emailError);
    }

    // Insert onboarding sequence record
    await supabase.from("onboarding_sequences").insert({
      user_id: userId,
      email,
      signup_date: new Date().toISOString(),
      day0_sent: true,
      day0_sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: "Onboarding started" });
  } catch (error) {
    console.error("[user-signup] Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
