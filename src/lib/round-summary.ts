import { GameRound } from "./types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function generateRoundSummary(round: GameRound): string {
  let text = `⛳ ${round.courseName} · ${formatDate(round.teeTime)}\n`;

  if (round.scorecards.length > 0) {
    const sorted = [...round.scorecards].sort(
      (a, b) => (a.total || 999) - (b.total || 999)
    );
    text +=
      sorted
        .map((sc) => {
          const player = round.players.find((p) => p.id === sc.playerId);
          return `${player?.name}: ${sc.total}`;
        })
        .join(" | ") + "\n";
  }

  if (round.skinsGame?.results?.payouts) {
    const payouts = round.skinsGame.results.payouts;
    const winners = Object.entries(payouts)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, amount]) => {
        const player = round.players.find((p) => p.id === playerId);
        return `${player?.name} won $${amount}`;
      });
    if (winners.length > 0) {
      text += `🎰 Skins: ${winners.join(", ")}\n`;
    }
  }

  if (round.nassauBet?.results?.payouts) {
    const payouts = round.nassauBet.results.payouts;
    const entries = Object.entries(payouts)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, amount]) => {
        const player = round.players.find((p) => p.id === playerId);
        const sign = amount > 0 ? "+" : "";
        return `${player?.name} ${sign}$${amount}`;
      });
    if (entries.length > 0) {
      text += `\u{1F3C6} Nassau: ${entries.join(", ")}\n`;
    }
  }

  const unsettled = round.settlements?.filter((s) => !s.settled) || [];
  if (unsettled.length > 0) {
    text += `💰 ${unsettled.length} settlement${unsettled.length > 1 ? "s" : ""} pending\n`;
  } else if (round.settlements && round.settlements.length > 0) {
    text += `💰 All settled ✅\n`;
  }

  text += `\n📱 nassau.golf/round/${round.shareCode}`;
  return text;
}
