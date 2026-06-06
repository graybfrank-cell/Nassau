import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, FROM_PERSONAL, REPLY_TO_PERSONAL } from "@/lib/email";
import { renderKitClaimEmail } from "@/emails/KitClaimEmail";

type SendKitClaimEmailOptions = {
  customerEmail: string;
  destinationSlug: string;
  destinationName: string;
  kitTitle: string;
  amountPaid: number; // in cents (Stripe native format)
  stripeSessionId: string;
};

/**
 * Generates a Supabase magic link for the buyer and emails them
 * a Nassau-branded message wrapping it.
 *
 * Designed to be fire-and-forget from the Stripe webhook — never
 * throws. Logs errors and returns. Webhook should still respond
 * 200 to Stripe even if email delivery fails.
 *
 * The buyer clicks the magic link → lands at /auth/callback →
 * Supabase verifies the OTP → redirects to /claim?session_id=...
 * where the kit-to-trip auto-creation will happen (Phase 3).
 */
export async function sendKitClaimEmail(
  opts: SendKitClaimEmailOptions
): Promise<void> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nassau.golf";

  const nextPath = `/claim?session_id=${encodeURIComponent(opts.stripeSessionId)}`;
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  try {
    // Generate the Supabase magic link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: opts.customerEmail,
      options: { redirectTo },
    });

    if (error) {
      console.error(
        `[kit-claim] generateLink failed for ${opts.stripeSessionId}:`,
        error
      );
      return;
    }

    const claimUrl = data?.properties?.action_link;
    if (!claimUrl) {
      console.error(
        `[kit-claim] generateLink returned no action_link for ${opts.stripeSessionId}`
      );
      return;
    }

    // Format amount: 2900 cents → "$29.00"
    const amountFormatted = `$${(opts.amountPaid / 100).toFixed(2)}`;

    // Render the email HTML
    const html = renderKitClaimEmail({
      destinationName: opts.destinationName,
      kitTitle: opts.kitTitle,
      claimUrl,
      amount: amountFormatted,
    });

    // Send via Resend
    const subject = `Your ${opts.destinationName} kit is ready`;
    const result = await sendEmail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO_PERSONAL,
      to: opts.customerEmail,
      subject,
      html,
    });

    if (!result) {
      console.error(
        `[kit-claim] sendEmail returned falsy for ${opts.stripeSessionId} — RESEND_API_KEY may be unset`
      );
      return;
    }

    console.log(
      `[kit-claim] Claim email sent to ${opts.customerEmail} for ${opts.destinationSlug} (session ${opts.stripeSessionId})`
    );
  } catch (err) {
    console.error(
      `[kit-claim] Unexpected error for ${opts.stripeSessionId}:`,
      err
    );
    // Swallow — webhook contract is to return 200 regardless
  }
}
