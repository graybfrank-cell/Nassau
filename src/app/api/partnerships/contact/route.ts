import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !company || !email) {
      return NextResponse.json(
        { error: "Name, company, and email are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const subject = `Nassau Partnerships Inquiry — ${company}`;

    const textBody = [
      `New partnerships inquiry from nassau.golf/partnerships`,
      ``,
      `Name: ${name}`,
      `Company: ${company}`,
      `Email: ${email}`,
      `Phone: ${phone || "(not provided)"}`,
      ``,
      `Tell us about your operation:`,
      message || "(not provided)",
    ].join("\n");

    const htmlBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111111;">
        <h2 style="margin:0 0 16px;">New partnerships inquiry</h2>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 8px;"><strong>Company:</strong> ${escapeHtml(company)}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phone || "(not provided)")}</p>
        <p style="margin:16px 0 4px;"><strong>Tell us about your operation:</strong></p>
        <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message || "(not provided)")}</p>
      </div>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: sendError } = await resend.emails.send({
      from: "Nassau Partnerships <grayson@nassau.golf>",
      replyTo: email,
      to: "grayson@nassau.golf",
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (sendError) {
      console.error("[partnerships/contact] Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[partnerships/contact] Error:", error);
    return NextResponse.json(
      { error: "Failed to send. Please try again." },
      { status: 500 }
    );
  }
}
