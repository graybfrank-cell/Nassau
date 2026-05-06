/**
 * Invite email — sent to crew when captain invites them to a trip.
 *
 * Voice: trip captain inner monologue. Short. Dry but warm. No emojis,
 * no exclamation marks, no marketing language.
 */

import { formatDates } from "./DateChangeNotification";

export function renderInviteEmail(data: {
  captainName: string;
  tripName: string;
  destination: string;
  startDate: string; // YYYY-MM-DD or empty string
  endDate: string;
  tripUrl: string;
}): string {
  const datesLabel =
    data.startDate && data.endDate
      ? formatDates(data.startDate, data.endDate)
      : "Dates TBD";
  const destinationLabel = data.destination || "Destination TBD";
  const subLine = `${destinationLabel}, ${datesLabel}.`;

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
              <h1 style="margin:0 0 14px 0;font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:700;color:#0A0A0A;line-height:1.15;">${data.captainName}'s planning a thing.</h1>
              <p style="margin:0 0 28px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.55;color:#6B6B6B;">${subLine}</p>
              <p style="margin:0 0 32px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0A0A0A;">He wants you in. RSVP when you can &mdash; link below.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#2D5A3D;border-radius:4px;">
                    <a href="${data.tripUrl}" style="display:inline-block;padding:13px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">RSVP &rarr;</a>
                  </td>
                </tr>
              </table>
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
