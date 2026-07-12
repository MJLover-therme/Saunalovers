// "Who am I" state. This build has no authentication — instead there are three
// fixed profiles (matching the seeded rows in the database) and a switcher.
// The active user id determines which ratings/comments/visits are editable.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface Profile {
  id: string;
  username: string;
  color: string;
  emoji: string;
}

// IDs are the deterministic UUIDs seeded in the database.
export const PROFILES: Profile[] = [
  { id: '11111111-1111-1111-1111-111111111111', username: 'Lukas', color: '#38bdf8', emoji: '🧖‍♂️' },
  { id: '22222222-2222-2222-2222-222222222222', username: 'Sophie', color: '#f472b6', emoji: '🧖‍♀️' },
  { id: '33333333-3333-3333-3333-333333333333', username: 'Jonas', color: '#a78bfa', emoji: '🧑' },
];

const STORAGE_KEY = 'saunalovers.currentUserId';

// Display info (emoji/color) for any user id, matched against the fixed profiles.
export function getProfile(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id === id);
}

interface CurrentUserContextValue {
  currentUser: Profile;
  setCurrentUserId: (id: string) => void;
  profiles: Profile[];
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && PROFILES.some((p) => p.id === saved) ? saved : PROFILES[0].id;
  });

  const setCurrentUserId = useCallback((id: string) => {
    setId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const currentUser =
    PROFILES.find((p) => p.id === currentUserId) ?? PROFILES[0];

  return (
    <CurrentUserContext.Provider
      value={{ currentUser, setCurrentUserId, profiles: PROFILES }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx)
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return ctx;
}
