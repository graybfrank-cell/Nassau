/**
 * Venmo deep link and web link builders for settlement payments.
 */

/**
 * Build a Venmo mobile deep link (venmo:// protocol).
 * Opens the Venmo app directly on mobile devices.
 */
export function buildVenmoLink(
  username: string,
  amount: number,
  note: string
): string {
  const cleanUsername = username.replace(/^@/, "");
  return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(cleanUsername)}&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note)}`;
}

/**
 * Build a Venmo web link for desktop fallback.
 * Opens venmo.com in the browser.
 */
export function buildVenmoWebLink(
  username: string,
  amount: number,
  note: string
): string {
  const cleanUsername = username.replace(/^@/, "");
  return `https://venmo.com/${encodeURIComponent(cleanUsername)}?txn=pay&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note)}`;
}

/**
 * Format a settlement note in the Nassau standard format.
 */
export function buildSettlementNote(
  courseName: string,
  gameType?: string
): string {
  if (gameType) {
    return `Nassau - ${courseName} - ${gameType}`;
  }
  return `Nassau - ${courseName}`;
}
