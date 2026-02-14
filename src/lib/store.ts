import { Trip, Expense, Round, SkinsGame, AppData } from "./types";

const STORAGE_KEY = "nassau_data";

function generateId(): string {
  return crypto.randomUUID();
}

function getData(): AppData {
  if (typeof window === "undefined") {
    return { trips: [], expenses: [], rounds: [], skinsGames: [] };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { trips: [], expenses: [], rounds: [], skinsGames: [] };
  return JSON.parse(raw);
}

function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- Trips ---

export function getTrips(userId: string): Trip[] {
  return getData().trips.filter((t) => t.userId === userId);
}

export function getTrip(tripId: string): Trip | null {
  return getData().trips.find((t) => t.id === tripId) || null;
}

export function createTrip(
  trip: Omit<Trip, "id" | "createdAt">
): Trip {
  const data = getData();
  const newTrip: Trip = {
    ...trip,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.trips.push(newTrip);
  saveData(data);
  return newTrip;
}

export function updateTrip(
  tripId: string,
  updates: Partial<Trip>
): Trip | null {
  const data = getData();
  const idx = data.trips.findIndex((t) => t.id === tripId);
  if (idx === -1) return null;
  data.trips[idx] = { ...data.trips[idx], ...updates };
  saveData(data);
  return data.trips[idx];
}

export function deleteTrip(tripId: string): void {
  const data = getData();
  data.trips = data.trips.filter((t) => t.id !== tripId);
  data.expenses = data.expenses.filter((e) => e.tripId !== tripId);
  data.rounds = data.rounds.filter((r) => r.tripId !== tripId);
  data.skinsGames = data.skinsGames.filter((s) => s.tripId !== tripId);
  saveData(data);
}

// --- Expenses ---

export function getExpenses(tripId: string): Expense[] {
  return getData().expenses.filter((e) => e.tripId === tripId);
}

export function addExpense(
  expense: Omit<Expense, "id" | "createdAt">
): Expense {
  const data = getData();
  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.expenses.push(newExpense);
  saveData(data);
  return newExpense;
}

export function deleteExpense(expenseId: string): void {
  const data = getData();
  data.expenses = data.expenses.filter((e) => e.id !== expenseId);
  saveData(data);
}

// --- Rounds / Pairings ---

export function getRounds(tripId: string): Round[] {
  return getData().rounds.filter((r) => r.tripId === tripId);
}

export function createRound(
  round: Omit<Round, "id" | "createdAt">
): Round {
  const data = getData();
  const newRound: Round = {
    ...round,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.rounds.push(newRound);
  saveData(data);
  return newRound;
}

export function updateRound(
  roundId: string,
  updates: Partial<Round>
): Round | null {
  const data = getData();
  const idx = data.rounds.findIndex((r) => r.id === roundId);
  if (idx === -1) return null;
  data.rounds[idx] = { ...data.rounds[idx], ...updates };
  saveData(data);
  return data.rounds[idx];
}

export function deleteRound(roundId: string): void {
  const data = getData();
  data.rounds = data.rounds.filter((r) => r.id !== roundId);
  saveData(data);
}

// --- Skins Games ---

export function getSkinsGames(tripId: string): SkinsGame[] {
  return getData().skinsGames.filter((s) => s.tripId === tripId);
}

export function createSkinsGame(
  game: Omit<SkinsGame, "id" | "createdAt">
): SkinsGame {
  const data = getData();
  const newGame: SkinsGame = {
    ...game,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.skinsGames.push(newGame);
  saveData(data);
  return newGame;
}

export function updateSkinsGame(
  gameId: string,
  updates: Partial<SkinsGame>
): SkinsGame | null {
  const data = getData();
  const idx = data.skinsGames.findIndex((s) => s.id === gameId);
  if (idx === -1) return null;
  data.skinsGames[idx] = { ...data.skinsGames[idx], ...updates };
  saveData(data);
  return data.skinsGames[idx];
}

export function deleteSkinsGame(gameId: string): void {
  const data = getData();
  data.skinsGames = data.skinsGames.filter((s) => s.id !== gameId);
  saveData(data);
}
