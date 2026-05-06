/**
 * Payment confirmation email — sent to captain when they pay the
 * $9.99 trip pass.
 *
 * Voice: trip captain inner monologue. Receipt-feeling but dry. No
 * emojis, no exclamation marks, no marketing language.
 */

export function renderPaymentConfirmation(data: {
  captainName: string;
  tripName: string;
  amount: string; // "$9.99"
  tripUrl: string;
  stripeReceiptUrl?: string;
}): string {
  const receiptLine = data.stripeReceiptUrl
    ? `Receipt: <a href="${data.stripeReceiptUrl}" style="color:#6B6B6B;text-decoration:underline;">View receipt</a>`
    : "Receipt: Charge will appear on your card statement.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Nassau</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F0EB;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F2F0EB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="background-color:#0A0A0A;padding:28px 32px;text-align:left;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#F2F0EB;letter-spacing:2px;">NASSAU</div>
              <div style="margin-top:10px;height:2px;width:36px;background-color:#C9A961;"></div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F2F0EB;padding:40px 32px 12px 32px;">
              <h1 style="margin:0 0 18px 0;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#0A0A0A;line-height:1.2;">Trip's unlocked.</h1>
              <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0A0A0A;">${data.tripName} is locked in. ${data.amount} paid.</p>
              <p style="margin:0 0 28px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0A0A0A;">Send the link to your crew. They'll get an email when you invite them.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#2D5A3D;border-radius:4px;">
                    <a href="${data.tripUrl}" style="display:inline-block;padding:13px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">Open trip &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#6B6B6B;">${receiptLine}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F2F0EB;padding:32px;border-top:1px solid #D9D5CA;">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#6B6B6B;text-align:center;">
                <a href="https://nassau.golf" style="color:#6B6B6B;text-decoration:none;">nassau.golf</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
