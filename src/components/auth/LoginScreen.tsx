import { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/CurrentUserContext';

/**
 * Shared-password login gate. Pick a profile, enter the shared password, log in.
 * (Frontend-only gate — see note in CurrentUserContext.)
 */
export default function LoginScreen() {
  const { profiles, login } = useAuth();
  const [selectedId, setSelectedId] = useState(profiles[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (!login(selectedId, password)) {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-base-900 p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 240 }}
        className="glass relative w-full max-w-sm rounded-3xl p-7 shadow-2xl ring-1 ring-white/10"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/sauna.svg" alt="" className="mb-3 h-14 w-14" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Sauna<span className="text-accent">lovers</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Wähle dein Profil und melde dich an</p>
        </div>

        {/* Profile picker */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {profiles.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  setError(false);
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl py-3 ring-1 transition-colors ${
                  active
                    ? 'bg-white/10 ring-accent/60'
                    : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <Avatar userId={p.id} username={p.username} color={p.color} ring={active} />
                <span className="text-sm font-semibold text-slate-200">{p.username}</span>
              </button>
            );
          })}
        </div>

        {/* Password */}
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">
          Passwort
        </label>
        <input
          type="password"
          value={password}
          autoFocus
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="••••••••"
          className={`w-full rounded-xl bg-base-900 px-4 py-2.5 text-sm text-slate-100 outline-none ring-1 transition-colors ${
            error ? 'ring-red-500/70' : 'ring-white/10 focus:ring-accent/60'
          }`}
        />
        {error && (
          <p className="mt-2 text-xs text-red-400">Falsches Passwort. Bitte erneut versuchen.</p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          className="mt-5 w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-base-900 shadow-lg shadow-accent/20 transition-shadow hover:shadow-accent/40"
        >
          Anmelden
        </motion.button>
      </motion.div>
    </div>
  );
}
