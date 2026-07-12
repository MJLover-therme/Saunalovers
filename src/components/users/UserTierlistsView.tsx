import { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import TierListView from '../tierlist/TierListView';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

/**
 * Community tier-list tab: a selector of all users on top, and the chosen user's
 * TierMaker-style list below (editable only if it's the current user's own).
 */
export default function UserTierlistsView() {
  const { currentUser } = useCurrentUser();
  const { users, ratingsForUser } = useData();
  const [selectedId, setSelectedId] = useState(currentUser.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* User selector */}
      <div className="mb-6 flex flex-wrap gap-3">
        {users.map((u) => {
          const active = u.id === selectedId;
          const count = ratingsForUser(u.id).length;
          return (
            <motion.button
              key={u.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedId(u.id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors ${
                active
                  ? 'bg-white/10 ring-accent/50'
                  : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]'
              }`}
            >
              <Avatar
                userId={u.id}
                username={u.username}
                color={u.color}
                ring={active}
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-100">
                  {u.username}
                  {u.id === currentUser.id && (
                    <span className="text-slate-500"> (du)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{count} bewertet</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <TierListView viewedUserId={selectedId} />
    </div>
  );
}
