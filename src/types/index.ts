// Domain types mirroring the Supabase schema. Kept hand-written and small so
// components have a clear, stable contract to work against.

import type { Tier } from '../lib/tiers';
import type { VisitStatus } from '../lib/config';

export interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  color: string | null;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  source: 'osm' | 'manual';
  osm_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  place_id: string;
  tier: Tier;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  place_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  user_id: string;
  place_id: string;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
}
