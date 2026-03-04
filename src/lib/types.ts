export interface Member {
  id: string;
  userId?: string;
  name: string;
  handicap: number;
  email?: string;
  role?: string;
  rsvpStatus?: string;
}

export interface Lodging {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  confirmationNumber: string;
  phone: string;
  notes: string;
}

export interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  type: "tee_time" | "dinner" | "activity" | "travel" | "other";
  cost: number;
  bookingStatus: string;
  phone: string;
  website: string;
  email: string;
  sortOrder: number;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  departureTime: string;
  members: Member[];
  lodging: Lodging;
  schedule: ScheduleItem[];
  inviteCode: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  paidBy: string; // member id
  splitAmong: string[]; // member ids
  createdAt: string;
}

export interface Round {
  id: string;
  tripId: string;
  name: string;
  courseName: string;
  date: string;
  groups: string[][]; // arrays of member ids
  itineraryItemId?: string;
  createdAt: string;
}

export interface SkinsHole {
  number: number;
  scores: Record<string, number>; // memberId -> score
}

export interface SkinsGame {
  id: string;
  tripId: string;
  name: string;
  players: string[]; // member ids
  stake: number;
  holes: SkinsHole[];
  itineraryItemId?: string;
  createdAt: string;
}

export interface ScorecardPlayer {
  id: string;
  name: string;
  handicap: number;
  scores: (number | null)[]; // one per hole, null = not entered
}

export interface Scorecard {
  id: string;
  userId: string;
  tripId: string | null;
  courseName: string;
  courseApiId: number | null;
  teeName: string;
  date: string;
  pars: number[]; // par for each hole
  yardages: number[]; // yardage for each hole
  handicaps: number[]; // handicap index for each hole
  players: ScorecardPlayer[];
  itineraryItemId?: string;
  createdAt: string;
}

export interface AppData {
  trips: Trip[];
  expenses: Expense[];
  rounds: Round[];
  skinsGames: SkinsGame[];
  scorecards: Scorecard[];
}

// ═══════════════════════════════════════════════════════════
// Commissioner Mode Types
// ═══════════════════════════════════════════════════════════

export interface GameRound {
  id: string;
  commissionerId: string;
  courseName: string;
  courseId?: string;
  courseLocation?: string;
  courseLat?: number;
  courseLng?: number;
  teeTime: string;
  status: "upcoming" | "in_progress" | "completed";
  shareCode: string;
  notes?: string;
  startingHole: number;
  players: GamePlayer[];
  scorecards: GameScorecard[];
  skinsGame?: GameSkinsGame | null;
  nassauBet?: GameNassauBet | null;
  expenses: GameExpense[];
  settlements: GameSettlement[];
  createdAt: string;
}

export interface GamePlayer {
  id: string;
  roundId: string;
  userId?: string;
  name: string;
  email?: string;
  status: "invited" | "confirmed" | "declined";
  role: "COMMISSIONER" | "PLAYER";
  joinedAt: string;
}

export interface GameScorecard {
  id: string;
  roundId: string;
  playerId: string;
  holes: number[];
  total?: number;
  frontNine?: number;
  backNine?: number;
  photoUrl?: string;
  createdAt: string;
}

export interface GameSkinsGame {
  id: string;
  roundId: string;
  buyIn: number;
  status: "active" | "completed";
  results?: {
    holes: { hole: number; winnerId: string | null; carryover: boolean }[];
    payouts: Record<string, number>;
  };
  createdAt: string;
}

export interface GameNassauBet {
  id: string;
  roundId: string;
  betAmount: number;
  status: "active" | "completed";
  results?: NassauBetResults;
  createdAt: string;
}

export interface NassauBetResults {
  frontNine: { winnerId: string | null; scores: Record<string, number> };
  backNine: { winnerId: string | null; scores: Record<string, number> };
  overall: { winnerId: string | null; scores: Record<string, number> };
  payouts: Record<string, number>;
}

export interface GameExpense {
  id: string;
  roundId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  category: string;
  createdAt: string;
}

export interface GameSettlement {
  id: string;
  roundId: string;
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  reason: string;
  settled: boolean;
  settledAt?: string;
  settledBy?: string;
  createdAt: string;
}
