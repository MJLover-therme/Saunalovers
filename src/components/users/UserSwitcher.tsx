import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/CurrentUserContext';

/**
 * Header account control: shows the logged-in profile and a logout action.
 * (Switching profiles means logging out and back in — the app is password-gated.)
 */
export default function UserSwitcher() {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!currentUser) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 ring-1 ring-white/10 transition-colors hover:bg-white/10"
      >
        <Avatar userId={currentUser.id} username={currentUser.username} size="sm" />
        <span className="hidden text-sm font-semibold text-slate-100 sm:block">
          {currentUser.username}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-slate-400">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl p-1.5 shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Avatar userId={currentUser.id} username={currentUser.username} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-100">
                  {currentUser.username}
                </p>
                <p className="text-[11px] text-slate-500">angemeldet</p>
              </div>
            </div>
            <div className="my-1 h-px bg-white/10" />
            <button
              type="button"
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-red-300"
            >
              <span>↩︎</span> Abmelden
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
