import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * From-address for personal emails (invite, RSVP, payment).
 * These feel like they come from Grayson personally.
 */
export const FROM_PERSONAL = "Grayson at Nassau <grayson@nassau.golf>";

/**
 * From-address for system emails (date changes, reminders).
 * These feel like they come from the product.
 */
export const FROM_SYSTEM = "Nassau <hello@nassau.golf>";

export const REPLY_TO_PERSONAL = "grayson@nassau.golf";
export const REPLY_TO_SYSTEM = "hello@nassau.golf";

type SendEmailOptions = {
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64-encoded
  }>;
};

/**
 * Send an email via Resend with consistent error handling.
 * Returns true if sent successfully, false otherwise.
 * Errors are logged but never thrown — email failure should never block the user action that triggered it.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn(
      "[email] Resend not configured (RESEND_API_KEY missing) — email skipped:",
      options.subject
    );
    return false;
  }

  try {
    await resend.emails.send({
      from: options.from,
      replyTo: options.replyTo,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    return true;
  } catch (err) {
    console.error("[email] Send failed:", options.subject, err);
    return false;
  }
}
