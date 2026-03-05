/**
 * Base email HTML template for Nassau marketing emails.
 * Returns raw HTML string (no React Email dependency needed).
 */

interface BaseEmailOptions {
  previewText?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function renderBaseEmail({
  previewText,
  bodyHtml,
  ctaText,
  ctaUrl,
}: BaseEmailOptions): string {
  const ctaBlock =
    ctaText && ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
          <tr>
            <td style="border-radius:8px;background-color:#10B981;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaText}</a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${previewText ? `<meta name="description" content="${previewText}"/>` : ""}
  <title>Nassau</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
              <span style="font-family:Inter,Arial,sans-serif;font-size:24px;font-weight:800;color:#10B981;letter-spacing:-0.5px;">Nassau</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;font-size:16px;line-height:1.6;color:#27272a;">
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#a1a1aa;">
              <p style="margin:0;">Nassau Golf &bull; Plan trips. Track rounds. Settle bets.</p>
              <p style="margin:4px 0 0 0;"><a href="https://nassau.golf" style="color:#10B981;text-decoration:none;">nassau.golf</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
