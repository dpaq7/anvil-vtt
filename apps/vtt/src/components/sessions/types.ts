/** Shape returned by GET /api/game-sessions → campaigns[]. */
export interface CampaignData {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  role: 'director' | 'player';
  director: { id: string; username: string; avatar_url: string | null } | null;
  members: CampaignMember[];
  modules: CampaignModule[];
  sessions: CampaignSession[];
  scenes: CampaignScene[];
  my_hero: PlayerHero | null;
  last_played: string | null;
}

export interface CampaignMember {
  user_id: string;
  username: string;
  avatar_url: string | null;
  hero_id: string | null;
  hero_name: string | null;
  hero_class: string | null;
  hero_level: number | null;
  role: string;
}

export interface CampaignModule {
  id: string;
  name: string;
  order_index: number;
}

export interface CampaignSession {
  id: string;
  name: string;
  module_id: string | null;
  status: string;
  room_code: string | null;
  started_at: string | null;
  ended_at: string | null;
  order_index: number;
}

export interface CampaignScene {
  id: string;
  title: string;
  type: string;
  game_session_id: string;
  order_index: number;
}

export interface PlayerHero {
  id: string;
  name: string | null;
  heroClass: string | null;
  level: number | null;
}

/** A session that is currently live (lobby or active). */
export interface LiveSession {
  id: string;
  name: string;
  status: string;
  room_code: string | null;
}
