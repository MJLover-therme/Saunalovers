// Auth + "who am I" state.
//
// This build uses a single shared password gate (no per-user credentials): you
// pick one of the three fixed profiles and enter the shared password to log in.
// NOTE: a frontend-only password is not real security — the app and its data key
// ship to the browser. It only keeps casual strangers out. Do not protect
// anything sensitive with it.

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
  { id: '11111111-1111-1111-1111-111111111111', username: 'Jannik', color: '#38bdf8', emoji: '🧖‍♂️' },
  { id: '22222222-2222-2222-2222-222222222222', username: 'Mert', color: '#fb923c', emoji: '🔥' },
  { id: '33333333-3333-3333-3333-333333333333', username: 'Tim', color: '#a78bfa', emoji: '💧' },
];

// Shared password for all three profiles.
const APP_PASSWORD = 'MJ_Lover';

const STORAGE_KEY = 'saunalovers.authUserId';

// Display info (emoji/color) for any user id, matched against the fixed profiles.
export function getProfile(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id === id);
}

interface AuthContextValue {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  profiles: Profile[];
  login: (userId: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && PROFILES.some((p) => p.id === saved) ? saved : null;
  });

  const login = useCallback((userId: string, password: string) => {
    if (password !== APP_PASSWORD) return false;
    if (!PROFILES.some((p) => p.id === userId)) return false;
    setCurrentUserId(userId);
    localStorage.setItem(STORAGE_KEY, userId);
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const currentUser = currentUserId
    ? PROFILES.find((p) => p.id === currentUserId) ?? null
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        profiles: PROFILES,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Full auth state (login screen, header).
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within CurrentUserProvider');
  return ctx;
}

// Convenience for the authenticated part of the app, where a user is guaranteed.
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): { currentUser: Profile } {
  const { currentUser } = useAuth();
  if (!currentUser)
    throw new Error('useCurrentUser used outside an authenticated view');
  return { currentUser };
}
