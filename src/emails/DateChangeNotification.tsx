/**
 * Date change notification email — sent to confirmed crew when captain
 * sets dates for the first time, or changes existing dates.
 *
 * Voice: trip captain inner monologue. Short. Confident. No emojis, no
 * exclamation marks, no marketing language.
 */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Format a date range as "June 12-15" (single month) or
 * "June 30-July 2" (cross-month). Input dates are YYYY-MM-DD strings.
 */
export function formatDates(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return startDate || endDate || "";
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) {
    return `${startDate} — ${endDate}`;
  }
  const startMonth = MONTH_NAMES[sm - 1];
  const endMonth = MONTH_NAMES[em - 1];
  if (sm === em && sy === ey) {
    return `${startMonth} ${sd}-${ed}`;
  }
  return `${startMonth} ${sd}-${endMonth} ${ed}`;
}

export function renderDateChangeNotification(data: {
  captainName: string;
  tripName: string;
  newStartDate: string;
  newEndDate: string;
  previousStartDate?: string;
  previousEndDate?: string;
  tripUrl: string;
}): string {
  const isChange = !!(data.previousStartDate && data.previousEndDate);
  const newRange = formatDates(data.newStartDate, data.newEndDate);
  const headline = isChange ? "Dates moved." : "Dates locked.";
  const body1 = isChange
    ? `${data.tripName} now ${newRange}. (Was ${formatDates(
        data.previousStartDate!,
        data.previousEndDate!
      )}.)`
    : `${data.tripName} — ${newRange}.`;
  const body2 = "Calendar invite attached. Add it now so you don't forget.";

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
            <td style="background-color:#F2F0EB;padding:36px 32px 12px 32px;">
              <h1 style="margin:0 0 20px 0;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#0A0A0A;line-height:1.2;">${headline}</h1>
              <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0A0A0A;">${body1}</p>
              <p style="margin:0 0 28px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.55;color:#3F3F3F;">${body2}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#2D5A3D;border-radius:4px;">
                    <a href="${data.tripUrl}" style="display:inline-block;padding:13px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">Open trip &rarr;</a>
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
