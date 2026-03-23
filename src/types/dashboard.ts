// ---------------------------------------------------------------------------
// Dashboard API response types (shared between client + server)
// ---------------------------------------------------------------------------

export interface DashboardPlayer {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface UpcomingRound {
  id: string;
  courseName: string;
  coursePhotoUrl: string | null;
  courseLocation: string | null;
  teeTime: string;
  weather: {
    temp?: number;
    icon?: string;
    wind?: number;
    description?: string;
  } | null;
  players: DashboardPlayer[];
}

export interface RecentScore {
  roundId: string;
  courseName: string;
  score: number;
  par: number | null;
  moneyNet: number;
  date: string;
  isPersonalBest: boolean;
}

export interface SettlementItem {
  fromUser?: string;
  toUser?: string;
  amount: number;
  roundNote: string | null;
}

export interface LifetimeStats {
  totalRounds: number;
  allTimePnl: number;
  bestScore: number | null;
  avgScore: number | null;
  totalSkinsWon: number;
  totalMoneyWon: number;
}

export interface RecentRoundDetail {
  roundId: string;
  courseName: string;
  date: string;
  score: number;
  moneyNet: number;
  awards: string[];
}

export interface HeadToHeadOpponent {
  opponentName: string;
  roundsTogether: number;
  wins: number;
  losses: number;
  moneyBalance: number;
}

export interface CourseHistoryEntry {
  courseName: string;
  timesPlayed: number;
  bestScore: number;
  avgScore: number;
}

export interface AwardCount {
  name: string;
  count: number;
}

export interface DashboardData {
  user: { fullName: string; firstName: string; venmoUsername: string | null };
  subscriptionActive?: boolean;
  upcomingRound: UpcomingRound | null;
  recentScores: RecentScore[];
  settlements: {
    owed: SettlementItem[];
    owing: SettlementItem[];
    totalOwed: number;
    totalOwing: number;
  };
  seasonStats: {
    totalMoneyNet: number;
    roundsThisMonth: number;
    scoringAvg: number | null;
  };
  lifetimeStats: LifetimeStats;
  recentRounds: RecentRoundDetail[];
  headToHead: HeadToHeadOpponent[];
  courseHistory: CourseHistoryEntry[];
  upcomingRounds: UpcomingRound[];
  awards: AwardCount[];
  _errors?: string[];
}

export interface OnboardingRequest {
  fullName: string;
  venmoUsername: string;
  handicap?: number | null;
}

export interface OnboardingResponse {
  success: boolean;
  error?: string;
}
