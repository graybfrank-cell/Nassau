/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GameRound,
  GamePlayer,
  GameScorecard,
  GameSkinsGame,
  GameNassauBet,
  GameExpense,
  GameSettlement,
} from "./types";

// --- Error helper ---

async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
}

// --- Rounds ---

export async function getGameRounds(): Promise<GameRound[]> {
  const res = await fetch("/api/game-rounds");
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapGameRound);
}

export async function getGameRound(id: string): Promise<GameRound | null> {
  const res = await fetch(`/api/game-rounds/${id}`);
  if (!res.ok) return null;
  return mapGameRound(await res.json());
}

export async function createGameRound(data: {
  courseName: string;
  courseId?: string;
  courseLocation?: string;
  courseLayout?: string;
  courseLat?: number;
  courseLng?: number;
  coursePhotoUrl?: string;
  courseAddress?: string;
  teeTime: string;
  notes?: string;
  startingHole?: number;
  skinsGame?: { buyIn: number };
  nassauBet?: { betAmount: number };
  players?: { name: string; email?: string }[];
}): Promise<GameRound> {
  const res = await fetch("/api/game-rounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return mapGameRound(await res.json());
}

export async function updateGameRound(
  id: string,
  updates: Partial<{
    courseName: string;
    teeTime: string;
    status: string;
    notes: string;
    startingHole: number;
  }>
): Promise<GameRound> {
  const res = await fetch(`/api/game-rounds/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  await assertOk(res);
  return mapGameRound(await res.json());
}

export async function deleteGameRound(id: string): Promise<void> {
  const res = await fetch(`/api/game-rounds/${id}`, { method: "DELETE" });
  await assertOk(res);
}

// --- Players ---

export async function addGamePlayer(
  roundId: string,
  data: { name: string; email?: string; userId?: string }
): Promise<GamePlayer> {
  const res = await fetch(`/api/game-rounds/${roundId}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return mapGamePlayer(await res.json());
}

export async function updateGamePlayer(
  roundId: string,
  playerId: string,
  updates: Partial<{ status: string; name: string }>
): Promise<GamePlayer> {
  const res = await fetch(
    `/api/game-rounds/${roundId}/players/${playerId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
  await assertOk(res);
  return mapGamePlayer(await res.json());
}

export async function removeGamePlayer(
  roundId: string,
  playerId: string
): Promise<void> {
  const res = await fetch(
    `/api/game-rounds/${roundId}/players/${playerId}`,
    { method: "DELETE" }
  );
  await assertOk(res);
}

// --- Scorecards ---

export async function saveGameScorecard(
  roundId: string,
  data: { playerId: string; holes: number[]; total?: number; frontNine?: number; backNine?: number }
): Promise<GameScorecard> {
  const res = await fetch(`/api/game-rounds/${roundId}/scorecards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player_id: data.playerId,
      holes: data.holes,
      total: data.total,
      front_nine: data.frontNine,
      back_nine: data.backNine,
    }),
  });
  await assertOk(res);
  return mapGameScorecard(await res.json());
}

export async function getGameScorecards(
  roundId: string
): Promise<GameScorecard[]> {
  const res = await fetch(`/api/game-rounds/${roundId}/scorecards`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapGameScorecard);
}

// --- Skins ---

export async function createGameSkins(
  roundId: string,
  data: { buyIn: number }
): Promise<GameSkinsGame> {
  const res = await fetch(`/api/game-rounds/${roundId}/skins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buy_in: data.buyIn }),
  });
  await assertOk(res);
  return mapGameSkinsGame(await res.json());
}

export async function getGameSkins(
  roundId: string
): Promise<GameSkinsGame | null> {
  const res = await fetch(`/api/game-rounds/${roundId}/skins`);
  if (!res.ok) return null;
  return mapGameSkinsGame(await res.json());
}

export async function deleteGameSkins(roundId: string): Promise<void> {
  const res = await fetch(`/api/game-rounds/${roundId}/skins`, {
    method: "DELETE",
  });
  await assertOk(res);
}

// --- Nassau Bet ---

export async function createGameNassauBet(
  roundId: string,
  data: { betAmount: number }
): Promise<GameNassauBet> {
  const res = await fetch(`/api/game-rounds/${roundId}/nassau-bet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ betAmount: data.betAmount }),
  });
  await assertOk(res);
  return mapGameNassauBet(await res.json());
}

export async function deleteGameNassauBet(roundId: string): Promise<void> {
  const res = await fetch(`/api/game-rounds/${roundId}/nassau-bet`, {
    method: "DELETE",
  });
  await assertOk(res);
}

// --- Expenses ---

export async function addGameExpense(
  roundId: string,
  data: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    category: string;
  }
): Promise<GameExpense> {
  const res = await fetch(`/api/game-rounds/${roundId}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: data.description,
      amount: data.amount,
      paid_by: data.paidBy,
      split_among: data.splitAmong,
      category: data.category,
    }),
  });
  await assertOk(res);
  return mapGameExpense(await res.json());
}

export async function getGameExpenses(
  roundId: string
): Promise<GameExpense[]> {
  const res = await fetch(`/api/game-rounds/${roundId}/expenses`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapGameExpense);
}

export async function deleteGameExpense(
  roundId: string,
  expenseId: string
): Promise<void> {
  const res = await fetch(
    `/api/game-rounds/${roundId}/expenses/${expenseId}`,
    { method: "DELETE" }
  );
  await assertOk(res);
}

// --- Settlements ---

export async function getGameSettlements(
  roundId: string
): Promise<GameSettlement[]> {
  const res = await fetch(`/api/game-rounds/${roundId}/settlements`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapGameSettlement);
}

export async function markSettlement(
  roundId: string,
  settlementId: string,
  settled: boolean
): Promise<GameSettlement> {
  const res = await fetch(
    `/api/game-rounds/${roundId}/settlements/${settlementId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settled }),
    }
  );
  await assertOk(res);
  return mapGameSettlement(await res.json());
}

export async function recalculateSettlements(
  roundId: string
): Promise<GameSettlement[]> {
  const res = await fetch(
    `/api/game-rounds/${roundId}/settlements/recalculate`,
    { method: "POST" }
  );
  await assertOk(res);
  const rows = await res.json();
  return rows.map(mapGameSettlement);
}

// --- Mappers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGameRound(row: any): GameRound {
  return {
    id: row.id,
    commissionerId: row.commissioner_id,
    courseName: row.course_name || "",
    courseId: row.course_id || undefined,
    courseLocation: row.course_location || undefined,
    courseLayout: row.course_layout || undefined,
    courseLat: row.course_lat ?? undefined,
    courseLng: row.course_lng ?? undefined,
    coursePhotoUrl: row.course_photo_url || undefined,
    courseAddress: row.course_address || undefined,
    weatherData: row.weather_data || undefined,
    awards: row.awards || undefined,
    teeTime: row.tee_time,
    status: row.status || "upcoming",
    shareCode: row.share_code,
    notes: row.notes || undefined,
    startingHole: row.starting_hole ?? 1,
    players: (row.players || []).map(mapGamePlayer),
    scorecards: (row.scorecards || []).map(mapGameScorecard),
    skinsGame: row.skins_game ? mapGameSkinsGame(row.skins_game) : null,
    nassauBet: row.nassau_bet ? mapGameNassauBet(row.nassau_bet) : null,
    expenses: (row.expenses || []).map(mapGameExpense),
    settlements: (row.settlements || []).map(mapGameSettlement),
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGamePlayer(row: any): GamePlayer {
  return {
    id: row.id,
    roundId: row.round_id,
    userId: row.user_id || undefined,
    name: row.name || "",
    email: row.email || undefined,
    status: row.status || "invited",
    role: row.role || "PLAYER",
    isPersonalBest: row.is_personal_best || false,
    joinedAt: row.joined_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGameScorecard(row: any): GameScorecard {
  return {
    id: row.id,
    roundId: row.round_id,
    playerId: row.player_id,
    holes: row.holes || [],
    total: row.total ?? undefined,
    frontNine: row.front_nine ?? undefined,
    backNine: row.back_nine ?? undefined,
    photoUrl: row.photo_url || undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGameSkinsGame(row: any): GameSkinsGame {
  return {
    id: row.id,
    roundId: row.round_id,
    buyIn: Number(row.buy_in) || 20,
    status: row.status || "active",
    results: row.results || undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGameNassauBet(row: any): GameNassauBet {
  return {
    id: row.id,
    roundId: row.round_id,
    betAmount: Number(row.bet_amount) || 10,
    status: row.status || "active",
    results: row.results || undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGameExpense(row: any): GameExpense {
  return {
    id: row.id,
    roundId: row.round_id,
    description: row.description || "",
    amount: Number(row.amount) || 0,
    paidBy: row.paid_by,
    splitAmong: row.split_among || [],
    category: row.category || "other",
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGameSettlement(row: any): GameSettlement {
  return {
    id: row.id,
    roundId: row.round_id,
    fromPlayer: row.from_player,
    toPlayer: row.to_player,
    amount: Number(row.amount) || 0,
    reason: row.reason || "combined",
    settled: row.settled || false,
    settledAt: row.settled_at || undefined,
    settledBy: row.settled_by || undefined,
    createdAt: row.created_at,
  };
}
