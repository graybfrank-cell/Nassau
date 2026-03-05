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
  type: "tee_time" | "dinner" | "activity" | "travel" | "other" | "lodging" | "entertainment";
  cost: number;
  bookingStatus: string;
  phone: string;
  website: string;
  email: string;
  notes: string;
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

// Type aliases for game-round components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameRound { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GamePlayer { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameScorecard { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameSkinsGame { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameNassauBet { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameExpense { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameSettlement { [key: string]: any; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface NassauBetResults { [key: string]: any; }
