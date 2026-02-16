import { Trip, Expense, Round, SkinsGame } from "./types";

// --- Trips ---

export async function getTrips(userId: string): Promise<Trip[]> {
  const res = await fetch(`/api/trips?userId=${userId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapTrip);
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const res = await fetch(`/api/trips/${tripId}`);
  if (!res.ok) return null;
  return mapTrip(await res.json());
}

export async function createTrip(
  trip: Omit<Trip, "id" | "createdAt">
): Promise<Trip> {
  const res = await fetch("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  return mapTrip(await res.json());
}

export async function updateTrip(
  tripId: string,
  updates: Partial<Trip>
): Promise<Trip | null> {
  const res = await fetch(`/api/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) return null;
  return mapTrip(await res.json());
}

export async function deleteTrip(tripId: string): Promise<void> {
  await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
}

// --- Expenses ---

export async function getExpenses(tripId: string): Promise<Expense[]> {
  const res = await fetch(`/api/expenses?tripId=${tripId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapExpense);
}

export async function addExpense(
  expense: Omit<Expense, "id" | "createdAt">
): Promise<Expense> {
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  return mapExpense(await res.json());
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
}

// --- Rounds / Pairings ---

export async function getRounds(tripId: string): Promise<Round[]> {
  const res = await fetch(`/api/rounds?tripId=${tripId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapRound);
}

export async function createRound(
  round: Omit<Round, "id" | "createdAt">
): Promise<Round> {
  const res = await fetch("/api/rounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(round),
  });
  return mapRound(await res.json());
}

export async function updateRound(
  roundId: string,
  updates: Partial<Round>
): Promise<Round | null> {
  const res = await fetch(`/api/rounds/${roundId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) return null;
  return mapRound(await res.json());
}

export async function deleteRound(roundId: string): Promise<void> {
  await fetch(`/api/rounds/${roundId}`, { method: "DELETE" });
}

// --- Skins Games ---

export async function getSkinsGames(tripId: string): Promise<SkinsGame[]> {
  const res = await fetch(`/api/skins?tripId=${tripId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapSkinsGame);
}

export async function createSkinsGame(
  game: Omit<SkinsGame, "id" | "createdAt">
): Promise<SkinsGame> {
  const res = await fetch("/api/skins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
  return mapSkinsGame(await res.json());
}

export async function updateSkinsGame(
  gameId: string,
  updates: Partial<SkinsGame>
): Promise<SkinsGame | null> {
  const res = await fetch(`/api/skins/${gameId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) return null;
  return mapSkinsGame(await res.json());
}

export async function deleteSkinsGame(gameId: string): Promise<void> {
  await fetch(`/api/skins/${gameId}`, { method: "DELETE" });
}

// --- Mappers (DB row → frontend type) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrip(row: any): Trip {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    destination: row.destination || "",
    startDate: row.startDate || "",
    endDate: row.endDate || "",
    members: row.members || [],
    inviteCode: row.inviteCode || null,
    createdAt: row.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpense(row: any): Expense {
  return {
    id: row.id,
    tripId: row.tripId,
    description: row.description,
    amount: row.amount,
    paidBy: row.paidBy,
    splitAmong: row.splitAmong || [],
    createdAt: row.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRound(row: any): Round {
  return {
    id: row.id,
    tripId: row.tripId,
    name: row.name,
    courseName: row.courseName || "",
    date: row.date || "",
    groups: row.groups || [],
    createdAt: row.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSkinsGame(row: any): SkinsGame {
  return {
    id: row.id,
    tripId: row.tripId,
    name: row.name,
    players: row.players || [],
    stake: row.stake,
    holes: row.holes || [],
    createdAt: row.createdAt,
  };
}
