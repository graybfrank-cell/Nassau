/**
 * Generates an .ics calendar file content for a Nassau trip.
 * Returned as a string ready for base64 encoding for email attachment.
 */
export function generateTripICS(data: {
  tripName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  destination: string;
  tripUrl: string;
}): string {
  // Format dates as YYYYMMDD for all-day events
  const startFmt = data.startDate.replace(/-/g, "");
  // ICS DTEND for all-day events is exclusive — add 1 day to endDate
  const endDate = new Date(`${data.endDate}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const endFmt = endDate.toISOString().slice(0, 10).replace(/-/g, "");

  const now =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `${data.tripName.replace(/\s+/g, "-").toLowerCase()}-${startFmt}@nassau.golf`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nassau Golf//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startFmt}`,
    `DTEND;VALUE=DATE:${endFmt}`,
    `SUMMARY:${data.tripName}`,
    `LOCATION:${data.destination}`,
    `URL:${data.tripUrl}`,
    `DESCRIPTION:View trip in Nassau: ${data.tripUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
