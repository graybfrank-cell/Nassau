import { Trip, Expense, Round, SkinsGame, Scorecard, Member, ScheduleItem } from "./types";

// --- Error helper ---

async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
}

// --- Trips ---

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch("/api/trips");
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapTrip);
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const res = await fetch(`/api/trips/${tripId}`);
  if (!res.ok) return null;
  return mapTrip(await res.json());
}

export async function createTrip(data: {
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Trip> {
  const res = await fetch("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await assertOk(res);
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
  await assertOk(res);
  return mapTrip(await res.json());
}

export async function deleteTrip(tripId: string): Promise<void> {
  const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
  await assertOk(res);
}

// --- Trip Members ---

export async function addMember(
  tripId: string,
  data: { name: string; handicap?: number }
): Promise<Member> {
  const res = await fetch(`/api/trips/${tripId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  const row = await res.json();
  return mapMember(row);
}

export async function removeMember(
  tripId: string,
  memberId: string
): Promise<void> {
  const res = await fetch(`/api/trips/${tripId}/members/${memberId}`, {
    method: "DELETE",
  });
  await assertOk(res);
}

// --- Itinerary ---

export async function addItineraryItem(
  tripId: string,
  data: { date: string; time: string; title: string; description: string; type: string }
): Promise<ScheduleItem> {
  const res = await fetch(`/api/trips/${tripId}/itinerary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  const row = await res.json();
  return mapItineraryItem(row);
}

export async function removeItineraryItem(
  tripId: string,
  itemId: string
): Promise<void> {
  const res = await fetch(`/api/trips/${tripId}/itinerary/${itemId}`, {
    method: "DELETE",
  });
  await assertOk(res);
}

// --- Expenses ---

export async function getExpenses(tripId: string): Promise<Expense[]> {
  const res = await fetch(`/api/expenses?tripId=${tripId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapExpense);
}

export async function addExpense(data: {
  tripId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
}): Promise<Expense> {
  const perPerson = data.splitAmong.length > 0
    ? data.amount / data.splitAmong.length
    : 0;
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tripId: data.tripId,
      description: data.description,
      amount: data.amount,
      paidBy: data.paidBy,
      splitMethod: "EQUAL",
      splits: data.splitAmong.map((memberId) => ({
        memberId,
        amount: Math.round(perPerson * 100) / 100,
      })),
    }),
  });
  await assertOk(res);
  return mapExpense(await res.json());
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
  await assertOk(res);
}

// --- Rounds / Pairings ---

export async function getRounds(tripId: string): Promise<Round[]> {
  const res = await fetch(`/api/rounds?tripId=${tripId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapRound);
}

export async function createRound(data: {
  tripId: string;
  name: string;
  courseName?: string;
  date?: string;
  groupSize?: number;
  groups: string[][];
}): Promise<Round> {
  const res = await fetch("/api/rounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await assertOk(res);
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
  await assertOk(res);
  return mapRound(await res.json());
}

export async function deleteRound(roundId: string): Promise<void> {
  const res = await fetch(`/api/rounds/${roundId}`, { method: "DELETE" });
  await assertOk(res);
}

// --- Skins Games ---

export async function getSkinsGames(tripId: string): Promise<SkinsGame[]> {
  const res = await fetch(`/api/skins?tripId=${tripId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapSkinsGame);
}

export async function createSkinsGame(data: {
  tripId: string;
  name: string;
  stake: number;
  players: string[];
  holes: { number: number; scores: Record<string, number> }[];
}): Promise<SkinsGame> {
  const res = await fetch("/api/skins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tripId: data.tripId,
      name: data.name,
      buyIn: data.stake,
      players: data.players,
      holes: data.holes,
    }),
  });
  await assertOk(res);
  return mapSkinsGame(await res.json());
}

export async function updateSkinsGame(
  gameId: string,
  updates: Partial<SkinsGame>
): Promise<SkinsGame | null> {
  // Translate stake → buyIn for the API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = { ...updates };
  if ("stake" in body) {
    body.buyIn = body.stake;
    delete body.stake;
  }
  const res = await fetch(`/api/skins/${gameId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await assertOk(res);
  return mapSkinsGame(await res.json());
}

export async function deleteSkinsGame(gameId: string): Promise<void> {
  const res = await fetch(`/api/skins/${gameId}`, { method: "DELETE" });
  await assertOk(res);
}

// --- Scorecards ---

export async function getScorecards(params: {
  userId?: string;
  tripId?: string;
}): Promise<Scorecard[]> {
  const query = new URLSearchParams();
  if (params.userId) query.set("userId", params.userId);
  if (params.tripId) query.set("tripId", params.tripId);
  const res = await fetch(`/api/scorecards?${query}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map(mapScorecard);
}

export async function getScorecard(id: string): Promise<Scorecard | null> {
  const res = await fetch(`/api/scorecards/${id}`);
  if (!res.ok) return null;
  return mapScorecard(await res.json());
}

export async function createScorecard(
  scorecard: Omit<Scorecard, "id" | "createdAt">
): Promise<Scorecard> {
  const res = await fetch("/api/scorecards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scorecard),
  });
  await assertOk(res);
  return mapScorecard(await res.json());
}

export async function updateScorecard(
  id: string,
  updates: Partial<Scorecard>
): Promise<Scorecard | null> {
  const res = await fetch(`/api/scorecards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  await assertOk(res);
  return mapScorecard(await res.json());
}

export async function deleteScorecard(id: string): Promise<void> {
  const res = await fetch(`/api/scorecards/${id}`, { method: "DELETE" });
  await assertOk(res);
}

// --- Mappers (DB row → frontend type) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMember(row: any): Member {
  return {
    id: row.id,
    name: row.name || "",
    handicap: Number(row.handicap) || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItineraryItem(row: any): ScheduleItem {
  return {
    id: row.id,
    date: row.date || "",
    time: row.time || "",
    title: row.title || "",
    description: row.description || "",
    type: row.type || "other",
  };
}

const EMPTY_LODGING = { name: "", address: "", checkIn: "", checkOut: "", confirmationNumber: "", phone: "", notes: "" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrip(row: any): Trip {
  // Map v2 TripMember[] → v1 Member[]
  const members: Member[] = (row.members || []).map(mapMember);

  // Map v2 itineraryItems → v1 schedule
  const schedule: ScheduleItem[] = (row.itineraryItems || []).map(mapItineraryItem);

  // Parse lodging JSON (stored as Json column)
  let lodging = EMPTY_LODGING;
  if (row.lodging && typeof row.lodging === "object" && row.lodging !== null) {
    lodging = {
      name: row.lodging.name || "",
      address: row.lodging.address || "",
      checkIn: row.lodging.checkIn || "",
      checkOut: row.lodging.checkOut || "",
      confirmationNumber: row.lodging.confirmationNumber || "",
      phone: row.lodging.phone || "",
      notes: row.lodging.notes || "",
    };
  }

  return {
    id: row.id,
    userId: row.created_by || row.userId || "",
    name: row.name,
    destination: row.destination || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    arrivalTime: row.arrival_time || "",
    departureTime: row.departure_time || "",
    members,
    lodging,
    schedule,
    inviteCode: row.invite_code || null,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpense(row: any): Expense {
  // Map v2 splits → v1 splitAmong (array of member IDs)
  const splitAmong: string[] = Array.isArray(row.splits)
    ? row.splits.map((s: { member_id: string }) => s.member_id)
    : row.splitAmong || [];

  return {
    id: row.id,
    tripId: row.trip_id,
    description: row.description || "",
    amount: Number(row.amount) || 0,
    paidBy: row.paid_by || "",
    splitAmong,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRound(row: any): Round {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name || "",
    courseName: row.course_name || "",
    date: row.date || "",
    groups: row.groups || [],
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSkinsGame(row: any): SkinsGame {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name || "",
    players: row.players || [],
    stake: Number(row.buy_in ?? row.stake) || 5,
    holes: row.holes || [],
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScorecard(row: any): Scorecard {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id || null,
    courseName: row.course_name || "",
    date: row.date || "",
    pars: row.pars || [],
    players: row.players || [],
    createdAt: row.created_at,
  };
}
