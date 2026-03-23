export type RoundStatus = 'upcoming' | 'in_progress' | 'completed';

export type PlayerStatus = 'invited' | 'confirmed' | 'declined';

export interface GameRound {
  id: string;
  commissioner_id: string;
  course_name: string;
  course_id: string | null;
  course_location: string | null;
  course_layout: string | null;
  course_lat: number | null;
  course_lng: number | null;
  course_photo_url: string | null;
  course_address: string | null;
  tee_time: Date;
  status: RoundStatus;
  share_code: string;
  notes: string | null;
  starting_hole: number;
  weather_data: unknown;
  awards: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface GamePlayer {
  id: string;
  round_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  status: PlayerStatus;
  role: string;
  is_personal_best: boolean;
  joined_at: Date;
}

export interface GameScorecard {
  id: string;
  round_id: string;
  player_id: string;
  holes: number[];
  total: number | null;
  front_nine: number | null;
  back_nine: number | null;
  photo_url: string | null;
  created_at: Date;
  updated_at: Date;
}
