import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import { useActivity } from '../../context/ActivityContext';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

interface Props {
  onGoToSauna: (placeId: string) => void;
}

/**
 * Header bell showing how many saunas have unseen ratings/comments from the
 * other two users. Opening an entry flies to that sauna (which marks it read).
 */
export default function WhatsNewButton({ onGoToSauna }: Props) {
  const { unreadByPlace, unreadCount, markAllSeen } = useActivity();
  const { placeById, ratings, comments, userById } = useData();
  const { currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Who most recently posted the unseen activity for a place (for the avatar).
  const latestAuthor = (placeId: string) => {
    const items = [...ratings, ...comments].filter(
      (i) => i.place_id === placeId && i.user_id !== currentUser.id,
    );
    items.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    return items[0] ? userById(items[0].user_id) : undefined;
  };

  const entries = [...unreadByPlace.keys()];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-base ring-1 ring-white/10 transition-colors hover:bg-white/10"
        title="Was ist neu?"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white ring-2 ring-base-800">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl p-1.5 shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Was ist neu?
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllSeen}
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  Alles gelesen
                </button>
              )}
            </div>

            {entries.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-slate-500">
                Keine neuen Bewertungen 🎉
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {entries.map((placeId) => {
                  const place = placeById(placeId);
                  const author = latestAuthor(placeId);
                  const n = unreadByPlace.get(placeId) ?? 0;
                  return (
                    <li key={placeId}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onGoToSauna(placeId);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
                      >
                        {author && (
                          <Avatar
                            userId={author.id}
                            username={author.username}
                            color={author.color}
                            size="sm"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {place?.name ?? 'Sauna'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {author?.username ?? 'Jemand'} · {n} neue{' '}
                            {n === 1 ? 'Aktivität' : 'Aktivitäten'}
                          </p>
                        </div>
                        <span className="text-slate-500">→</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
