import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import { useCurrentUser } from '../../context/CurrentUserContext';

/**
 * Active-profile picker (there is no login in this build). Switching changes
 * whose ratings/comments/visits are editable across the whole app.
 */
export default function UserSwitcher() {
  const { currentUser, setCurrentUserId, profiles } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 ring-1 ring-white/10 transition-colors hover:bg-white/10"
      >
        <Avatar userId={currentUser.id} username={currentUser.username} size="sm" />
        <span className="text-sm font-semibold text-slate-100">
          {currentUser.username}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-slate-400">
          <path
            fill="currentColor"
            d="M7 10l5 5 5-5z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl p-1.5 shadow-2xl ring-1 ring-white/10"
          >
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Angemeldet als
            </p>
            {profiles.map((p) => {
              const active = p.id === currentUser.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setCurrentUserId(p.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                    active ? 'bg-accent/15 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Avatar userId={p.id} username={p.username} size="sm" />
                  <span className="font-medium">{p.username}</span>
                  {active && <span className="ml-auto text-accent">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
