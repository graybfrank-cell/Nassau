/**
 * RSVP notification email — sent to captain when a crew member RSVPs.
 *
 * Voice: trip captain inner monologue. Short. No emojis, no exclamation
 * marks, no marketing language. The whole email is a headline plus a
 * crew count and a small "view trip" link — no big CTA button.
 */

type RSVPStatus = "GOING" | "MAYBE" | "DECLINED";

function headlineFor(status: RSVPStatus, memberName: string): string {
  if (status === "GOING") return `${memberName}'s in.`;
  if (status === "MAYBE") return `${memberName} is a maybe.`;
  return `${memberName}'s out.`;
}

export function renderRSVPNotification(data: {
  memberName: string;
  rsvpStatus: RSVPStatus;
  tripName: string;
  confirmedCount: number;
  totalInvited: number;
  tripUrl: string;
}): string {
  const headline = headlineFor(data.rsvpStatus, data.memberName);
  const crewLine = `Crew's at ${data.confirmedCount} of ${data.totalInvited} confirmed.`;

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
            <td style="background-color:#F2F0EB;padding:40px 32px;">
              <h1 style="margin:0 0 16px 0;font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;color:#0A0A0A;line-height:1.2;">${headline}</h1>
              <p style="margin:0 0 24px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0A0A0A;">${crewLine}</p>
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#2D5A3D;">
                <a href="${data.tripUrl}" style="color:#2D5A3D;text-decoration:none;font-weight:600;">View trip &rarr;</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F2F0EB;padding:24px 32px;border-top:1px solid #D9D5CA;">
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
