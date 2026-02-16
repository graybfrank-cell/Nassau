export interface Member {
  id: string;
  name: string;
  handicap: number;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  members: Member[];
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
  date: string;
  pars: number[]; // par for each hole
  players: ScorecardPlayer[];
  createdAt: string;
}

export interface AppData {
  trips: Trip[];
  expenses: Expense[];
  rounds: Round[];
  skinsGames: SkinsGame[];
  scorecards: Scorecard[];
}
