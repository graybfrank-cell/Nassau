export interface Award {
  title: string;
  playerId: string;
  playerName: string;
  description: string;
}

interface RoundData {
  players: { id: string; name: string; role: string }[];
  scorecards: {
    playerId: string;
    holes: number[];
    total?: number;
    frontNine?: number;
    backNine?: number;
  }[];
  skinsGame?: { results?: { payouts: Record<string, number> } } | null;
  settlements: { fromPlayer: string; toPlayer: string; amount: number }[];
}

function getPlayerName(
  players: RoundData["players"],
  playerId: string
): string {
  return players.find((p) => p.id === playerId)?.name || "Unknown";
}

export function computeAwards(round: RoundData): Award[] {
  const awards: Award[] = [];
  const { players, scorecards, skinsGame, settlements } = round;

  // 1. Skins Assassin — player who won the most skins (highest payout value)
  if (skinsGame?.results?.payouts) {
    const payouts = skinsGame.results.payouts;
    const entries = Object.entries(payouts).filter(([, v]) => v > 0);
    if (entries.length > 0) {
      const [topId, topAmount] = entries.reduce((best, curr) =>
        curr[1] > best[1] ? curr : best
      );
      awards.push({
        title: "Skins Assassin",
        playerId: topId,
        playerName: getPlayerName(players, topId),
        description: `Won $${topAmount.toFixed(2)} in skins`,
      });
    }
  }

  // 2. The Wallet — player who paid out the most money (sum of settlements as fromPlayer)
  if (settlements.length > 0) {
    const payouts: Record<string, number> = {};
    for (const s of settlements) {
      payouts[s.fromPlayer] = (payouts[s.fromPlayer] || 0) + s.amount;
    }
    const entries = Object.entries(payouts);
    if (entries.length > 0) {
      const [topId, topAmount] = entries.reduce((best, curr) =>
        curr[1] > best[1] ? curr : best
      );
      awards.push({
        title: "The Wallet",
        playerId: topId,
        playerName: getPlayerName(players, topId),
        description: `Paid out $${topAmount.toFixed(2)} total`,
      });
    }
  }

  // 3. Cashing In — player who won the most money (sum of settlements as toPlayer)
  if (settlements.length > 0) {
    const winnings: Record<string, number> = {};
    for (const s of settlements) {
      winnings[s.toPlayer] = (winnings[s.toPlayer] || 0) + s.amount;
    }
    const entries = Object.entries(winnings);
    if (entries.length > 0) {
      const [topId, topAmount] = entries.reduce((best, curr) =>
        curr[1] > best[1] ? curr : best
      );
      awards.push({
        title: "Cashing In",
        playerId: topId,
        playerName: getPlayerName(players, topId),
        description: `Won $${topAmount.toFixed(2)} total`,
      });
    }
  }

  // 4. Mr. Consistent — lowest absolute difference between front and back nine
  const consistentCandidates = scorecards.filter(
    (sc) =>
      sc.frontNine != null &&
      sc.backNine != null &&
      sc.frontNine > 0 &&
      sc.backNine > 0
  );
  if (consistentCandidates.length >= 2) {
    const best = consistentCandidates.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.frontNine! - prev.backNine!);
      const currDiff = Math.abs(curr.frontNine! - curr.backNine!);
      return currDiff < prevDiff ? curr : prev;
    });
    const diff = Math.abs(best.frontNine! - best.backNine!);
    awards.push({
      title: "Mr. Consistent",
      playerId: best.playerId,
      playerName: getPlayerName(players, best.playerId),
      description: `Front ${best.frontNine}, Back ${best.backNine} (${diff} stroke difference)`,
    });
  }

  // 5. Comeback Kid — biggest improvement from front 9 to back 9
  const comebackCandidates = scorecards.filter(
    (sc) =>
      sc.frontNine != null &&
      sc.backNine != null &&
      sc.frontNine > 0 &&
      sc.backNine > 0
  );
  if (comebackCandidates.length > 0) {
    const best = comebackCandidates.reduce((prev, curr) => {
      const prevImprovement = prev.frontNine! - prev.backNine!;
      const currImprovement = curr.frontNine! - curr.backNine!;
      return currImprovement > prevImprovement ? curr : prev;
    });
    const improvement = best.frontNine! - best.backNine!;
    if (improvement > 0) {
      awards.push({
        title: "Comeback Kid",
        playerId: best.playerId,
        playerName: getPlayerName(players, best.playerId),
        description: `Improved by ${improvement} strokes on the back nine (${best.frontNine} / ${best.backNine})`,
      });
    }
  }

  // 6. The Closer — best (lowest) score on the last 3 holes (indices 15, 16, 17)
  const closerCandidates = scorecards.filter((sc) => {
    if (!sc.holes || sc.holes.length < 18) return false;
    return sc.holes[15] > 0 && sc.holes[16] > 0 && sc.holes[17] > 0;
  });
  if (closerCandidates.length >= 2) {
    const best = closerCandidates.reduce((prev, curr) => {
      const prevTotal = prev.holes[15] + prev.holes[16] + prev.holes[17];
      const currTotal = curr.holes[15] + curr.holes[16] + curr.holes[17];
      return currTotal < prevTotal ? curr : prev;
    });
    const total = best.holes[15] + best.holes[16] + best.holes[17];
    awards.push({
      title: "The Closer",
      playerId: best.playerId,
      playerName: getPlayerName(players, best.playerId),
      description: `Shot ${total} on the last 3 holes`,
    });
  }

  // 7. Low Round — lowest total score
  const totalCandidates = scorecards.filter(
    (sc) => sc.total != null && sc.total > 0
  );
  if (totalCandidates.length >= 2) {
    const best = totalCandidates.reduce((prev, curr) =>
      curr.total! < prev.total! ? curr : prev
    );
    awards.push({
      title: "Low Round",
      playerId: best.playerId,
      playerName: getPlayerName(players, best.playerId),
      description: `Shot ${best.total} for the round`,
    });
  }

  return awards;
}
