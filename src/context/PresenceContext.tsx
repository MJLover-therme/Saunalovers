// Live "who's online" using Supabase Realtime presence. Each logged-in client
// joins a shared channel keyed by its user id; everyone sees the set of present
// users. No database access needed — presence rides the Realtime socket.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './CurrentUserContext';

interface PresenceContextValue {
  onlineIds: Set<string>;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) {
      setOnlineIds(new Set());
      return;
    }
    const channel = supabase.channel('presence:lobby', {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const value = useMemo<PresenceContextValue>(
    () => ({ onlineIds, isOnline: (id) => onlineIds.has(id) }),
    [onlineIds],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider');
  return ctx;
}
