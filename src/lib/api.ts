// Thin, typed wrappers around Supabase queries. Pure data access only — no
// React, no UI. The DataContext orchestrates these; components never call them
// directly. This keeps UI / logic / persistence cleanly separated.

import { supabase } from './supabaseClient';
import type { User, Place, Rating, Comment, Visit } from '../types';
import type { Tier } from './tiers';
import type { VisitStatus } from './config';

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as User[];
}

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase.from('places').select('*');
  if (error) throw error;
  return data as Place[];
}

export async function fetchRatings(): Promise<Rating[]> {
  const { data, error } = await supabase.from('ratings').select('*');
  if (error) throw error;
  return data as Rating[];
}

export async function fetchComments(): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Comment[];
}

export async function fetchVisits(): Promise<Visit[]> {
  const { data, error } = await supabase.from('visits').select('*');
  if (error) throw error;
  return data as Visit[];
}

// One rating per (user, place): upsert on that unique pair.
export async function upsertRating(input: {
  user_id: string;
  place_id: string;
  tier: Tier;
  position: number;
}): Promise<Rating> {
  const { data, error } = await supabase
    .from('ratings')
    .upsert(input, { onConflict: 'user_id,place_id' })
    .select()
    .single();
  if (error) throw error;
  return data as Rating;
}

export async function deleteRating(
  user_id: string,
  place_id: string,
): Promise<void> {
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('user_id', user_id)
    .eq('place_id', place_id);
  if (error) throw error;
}

// Persist new tier + order for a batch of a user's ratings (drag reorder).
export async function saveRatingOrder(
  rows: { user_id: string; place_id: string; tier: Tier; position: number }[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('ratings')
    .upsert(rows, { onConflict: 'user_id,place_id' });
  if (error) throw error;
}

export async function upsertVisit(input: {
  user_id: string;
  place_id: string;
  status: VisitStatus;
}): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .upsert(input, { onConflict: 'user_id,place_id' })
    .select()
    .single();
  if (error) throw error;
  return data as Visit;
}

export async function upsertComment(input: {
  user_id: string;
  place_id: string;
  body: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .upsert(input, { onConflict: 'user_id,place_id' })
    .select()
    .single();
  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(
  user_id: string,
  place_id: string,
): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('user_id', user_id)
    .eq('place_id', place_id);
  if (error) throw error;
}

export async function insertPlace(input: {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  created_by: string;
}): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .insert({ ...input, source: 'manual' })
    .select()
    .single();
  if (error) throw error;
  return data as Place;
}
