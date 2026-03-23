export interface SkinsGame {
  id: string;
  round_id: string;
  buy_in: number;
  status: string;
  results: unknown;
  created_at: Date;
}

export interface NassauBet {
  id: string;
  round_id: string;
  bet_amount: number;
  status: string;
  results: unknown;
  created_at: Date;
}

export interface GameExpense {
  id: string;
  round_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_among: string[];
  category: string;
  created_at: Date;
}

export interface GameSettlement {
  id: string;
  round_id: string;
  from_player: string;
  to_player: string;
  amount: number;
  reason: string;
  settled: boolean;
  settled_at: Date | null;
  settled_by: string | null;
  created_at: Date;
}

export interface SkinResult {
  holeNumber: number;
  winnerId: string | null;
  amount: number;
  carried: boolean;
}
