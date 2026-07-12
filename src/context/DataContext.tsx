// Central app data store. Loads users, places, ratings, comments and visits
// once, then serves them to the whole UI with memoized selectors and optimistic
// mutators. Components read/write through this context and never touch Supabase
// directly (clean UI / logic / data separation).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import * as api from '../lib/api';
import type { User, Place, Rating, Comment, Visit } from '../types';
import type { Tier } from '../lib/tiers';
import type { VisitStatus } from '../lib/config';

interface DataContextValue {
  loading: boolean;
  error: string | null;
  users: User[];
  places: Place[];
  ratings: Rating[];
  comments: Comment[];
  visits: Visit[];

  // selectors
  ratingFor: (userId: string, placeId: string) => Rating | undefined;
  ratingsForPlace: (placeId: string) => Rating[];
  ratingsForUser: (userId: string) => Rating[];
  visitStatusFor: (userId: string, placeId: string) => VisitStatus;
  commentsForPlace: (placeId: string) => Comment[];
  commentFor: (userId: string, placeId: string) => Comment | undefined;
  placeById: (placeId: string) => Place | undefined;
  userById: (userId: string) => User | undefined;

  // mutators (optimistic)
  setRating: (userId: string, placeId: string, tier: Tier) => Promise<void>;
  clearRating: (userId: string, placeId: string) => Promise<void>;
  reorderUserRatings: (
    userId: string,
    next: { place_id: string; tier: Tier; position: number }[],
  ) => Promise<void>;
  setVisit: (
    userId: string,
    placeId: string,
    status: VisitStatus,
  ) => Promise<void>;
  saveComment: (userId: string, placeId: string, body: string) => Promise<void>;
  removeComment: (userId: string, placeId: string) => Promise<void>;
  addPlace: (input: {
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    created_by: string;
  }) => Promise<Place>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [u, p, r, c, v] = await Promise.all([
        api.fetchUsers(),
        api.fetchPlaces(),
        api.fetchRatings(),
        api.fetchComments(),
        api.fetchVisits(),
      ]);
      setUsers(u);
      setPlaces(p);
      setRatings(r);
      setComments(c);
      setVisits(v);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ---- selectors -------------------------------------------------------
  const ratingFor = useCallback(
    (userId: string, placeId: string) =>
      ratings.find((r) => r.user_id === userId && r.place_id === placeId),
    [ratings],
  );
  const ratingsForPlace = useCallback(
    (placeId: string) => ratings.filter((r) => r.place_id === placeId),
    [ratings],
  );
  const ratingsForUser = useCallback(
    (userId: string) => ratings.filter((r) => r.user_id === userId),
    [ratings],
  );
  const visitStatusFor = useCallback(
    (userId: string, placeId: string): VisitStatus =>
      visits.find((v) => v.user_id === userId && v.place_id === placeId)
        ?.status ?? 'not_visited',
    [visits],
  );
  const commentsForPlace = useCallback(
    (placeId: string) => comments.filter((c) => c.place_id === placeId),
    [comments],
  );
  const commentFor = useCallback(
    (userId: string, placeId: string) =>
      comments.find((c) => c.user_id === userId && c.place_id === placeId),
    [comments],
  );
  const placeById = useCallback(
    (placeId: string) => places.find((p) => p.id === placeId),
    [places],
  );
  const userById = useCallback(
    (userId: string) => users.find((u) => u.id === userId),
    [users],
  );

  // ---- mutators (optimistic; refetch on failure) -----------------------
  const setRating = useCallback(
    async (userId: string, placeId: string, tier: Tier) => {
      const existing = ratingFor(userId, placeId);
      // Place at the end of the target tier row for this user.
      const nextPos =
        ratings
          .filter((r) => r.user_id === userId && r.tier === tier)
          .reduce((max, r) => Math.max(max, r.position), -1) + 1;
      const optimistic: Rating = {
        id: existing?.id ?? `temp-${placeId}`,
        user_id: userId,
        place_id: placeId,
        tier,
        position: existing?.tier === tier ? existing.position : nextPos,
        created_at: existing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRatings((prev) => {
        const rest = prev.filter(
          (r) => !(r.user_id === userId && r.place_id === placeId),
        );
        return [...rest, optimistic];
      });

      // Rating a place implies you've been there → ensure it's marked visited.
      setVisits((prev) => {
        if (
          prev.some(
            (v) =>
              v.user_id === userId &&
              v.place_id === placeId &&
              v.status === 'visited',
          )
        )
          return prev;
        const rest = prev.filter(
          (v) => !(v.user_id === userId && v.place_id === placeId),
        );
        return [
          ...rest,
          {
            id: `temp-visit-${placeId}`,
            user_id: userId,
            place_id: placeId,
            status: 'visited',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });
      void api
        .upsertVisit({ user_id: userId, place_id: placeId, status: 'visited' })
        .then((savedVisit) =>
          setVisits((prev) =>
            prev.map((v) =>
              v.user_id === userId && v.place_id === placeId ? savedVisit : v,
            ),
          ),
        )
        .catch((err) => console.error('auto-visit failed', err));

      try {
        const saved = await api.upsertRating({
          user_id: userId,
          place_id: placeId,
          tier,
          position: optimistic.position,
        });
        setRatings((prev) =>
          prev.map((r) =>
            r.user_id === userId && r.place_id === placeId ? saved : r,
          ),
        );
      } catch (e) {
        console.error('setRating failed', e);
        void loadAll();
      }
    },
    [ratingFor, ratings, loadAll],
  );

  const clearRating = useCallback(
    async (userId: string, placeId: string) => {
      const snapshot = ratings;
      setRatings((prev) =>
        prev.filter(
          (r) => !(r.user_id === userId && r.place_id === placeId),
        ),
      );
      try {
        await api.deleteRating(userId, placeId);
      } catch (e) {
        console.error('clearRating failed', e);
        setRatings(snapshot);
      }
    },
    [ratings],
  );

  const reorderUserRatings = useCallback(
    async (
      userId: string,
      next: { place_id: string; tier: Tier; position: number }[],
    ) => {
      const snapshot = ratings;
      // Apply new tier/position to this user's ratings locally.
      setRatings((prev) =>
        prev.map((r) => {
          if (r.user_id !== userId) return r;
          const upd = next.find((n) => n.place_id === r.place_id);
          return upd ? { ...r, tier: upd.tier, position: upd.position } : r;
        }),
      );
      try {
        await api.saveRatingOrder(
          next.map((n) => ({ user_id: userId, ...n })),
        );
      } catch (e) {
        console.error('reorderUserRatings failed', e);
        setRatings(snapshot);
      }
    },
    [ratings],
  );

  const setVisit = useCallback(
    async (userId: string, placeId: string, status: VisitStatus) => {
      const snapshot = visits;
      setVisits((prev) => {
        const rest = prev.filter(
          (v) => !(v.user_id === userId && v.place_id === placeId),
        );
        return [
          ...rest,
          {
            id: `temp-${placeId}`,
            user_id: userId,
            place_id: placeId,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });
      try {
        const saved = await api.upsertVisit({ user_id: userId, place_id: placeId, status });
        setVisits((prev) =>
          prev.map((v) =>
            v.user_id === userId && v.place_id === placeId ? saved : v,
          ),
        );
      } catch (e) {
        console.error('setVisit failed', e);
        setVisits(snapshot);
      }
    },
    [visits],
  );

  const saveComment = useCallback(
    async (userId: string, placeId: string, body: string) => {
      try {
        const saved = await api.upsertComment({ user_id: userId, place_id: placeId, body });
        setComments((prev) => {
          const rest = prev.filter(
            (c) => !(c.user_id === userId && c.place_id === placeId),
          );
          return [...rest, saved];
        });
      } catch (e) {
        console.error('saveComment failed', e);
        throw e;
      }
    },
    [],
  );

  const removeComment = useCallback(
    async (userId: string, placeId: string) => {
      const snapshot = comments;
      setComments((prev) =>
        prev.filter(
          (c) => !(c.user_id === userId && c.place_id === placeId),
        ),
      );
      try {
        await api.deleteComment(userId, placeId);
      } catch (e) {
        console.error('removeComment failed', e);
        setComments(snapshot);
      }
    },
    [comments],
  );

  const addPlace = useCallback(
    async (input: {
      name: string;
      address: string | null;
      latitude: number;
      longitude: number;
      created_by: string;
    }) => {
      const saved = await api.insertPlace(input);
      setPlaces((prev) => [...prev, saved]);
      return saved;
    },
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      error,
      users,
      places,
      ratings,
      comments,
      visits,
      ratingFor,
      ratingsForPlace,
      ratingsForUser,
      visitStatusFor,
      commentsForPlace,
      commentFor,
      placeById,
      userById,
      setRating,
      clearRating,
      reorderUserRatings,
      setVisit,
      saveComment,
      removeComment,
      addPlace,
    }),
    [
      loading,
      error,
      users,
      places,
      ratings,
      comments,
      visits,
      ratingFor,
      ratingsForPlace,
      ratingsForUser,
      visitStatusFor,
      commentsForPlace,
      commentFor,
      placeById,
      userById,
      setRating,
      clearRating,
      reorderUserRatings,
      setVisit,
      saveComment,
      removeComment,
      addPlace,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
