// "Look what's new": tracks which places have ratings/comments from OTHER users
// that the current user hasn't seen yet. Seen-state is per user in localStorage:
// a baseline timestamp (set on first ever load, so old content isn't flagged)
// plus a per-place last-seen timestamp advanced when the place is opened.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { useData } from './DataContext';
import { useAuth } from './CurrentUserContext';

interface SeenState {
  baseline: string; // ISO; activity older than this is considered already seen
  places: Record<string, string>; // placeId -> ISO last opened
}

interface ActivityContextValue {
  /** placeId -> number of unseen items from other users */
  unreadByPlace: Map<string, number>;
  unreadCount: number;
  markSeen: (placeId: string) => void;
  markAllSeen: () => void;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

const keyFor = (userId: string) => `saunalovers.seen.${userId}`;

function loadSeen(userId: string): SeenState {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (raw) return JSON.parse(raw) as SeenState;
  } catch {
    /* ignore */
  }
  // First load for this user: everything up to now counts as already seen.
  const fresh: SeenState = { baseline: new Date().toISOString(), places: {} };
  localStorage.setItem(keyFor(userId), JSON.stringify(fresh));
  return fresh;
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { ratings, comments } = useData();
  const [seen, setSeen] = useState<SeenState | null>(null);

  // (Re)load seen-state whenever the logged-in user changes.
  useEffect(() => {
    setSeen(currentUser ? loadSeen(currentUser.id) : null);
  }, [currentUser]);

  const persist = useCallback(
    (next: SeenState) => {
      if (!currentUser) return;
      setSeen(next);
      localStorage.setItem(keyFor(currentUser.id), JSON.stringify(next));
    },
    [currentUser],
  );

  const markSeen = useCallback(
    (placeId: string) => {
      if (!seen) return;
      persist({
        ...seen,
        places: { ...seen.places, [placeId]: new Date().toISOString() },
      });
    },
    [seen, persist],
  );

  const unreadByPlace = useMemo(() => {
    const map = new Map<string, number>();
    if (!currentUser || !seen) return map;
    const threshold = (placeId: string) => seen.places[placeId] ?? seen.baseline;
    const consider = (
      items: { user_id: string; place_id: string; updated_at: string }[],
    ) => {
      for (const it of items) {
        if (it.user_id === currentUser.id) continue; // only others' activity
        if (it.updated_at > threshold(it.place_id)) {
          map.set(it.place_id, (map.get(it.place_id) ?? 0) + 1);
        }
      }
    };
    consider(ratings);
    consider(comments);
    return map;
  }, [currentUser, seen, ratings, comments]);

  const markAllSeen = useCallback(() => {
    if (!seen) return;
    const now = new Date().toISOString();
    const places = { ...seen.places };
    unreadByPlace.forEach((_, placeId) => {
      places[placeId] = now;
    });
    persist({ baseline: now, places });
  }, [seen, unreadByPlace, persist]);

  const value = useMemo<ActivityContextValue>(
    () => ({
      unreadByPlace,
      unreadCount: unreadByPlace.size,
      markSeen,
      markAllSeen,
    }),
    [unreadByPlace, markSeen, markAllSeen],
  );

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}
