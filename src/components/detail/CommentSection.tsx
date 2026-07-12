import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

interface Props {
  placeId: string;
}

/**
 * Public comments for a place. Everyone sees all comments; the current user can
 * add/edit/delete only their own (one editable comment per user per place).
 */
export default function CommentSection({ placeId }: Props) {
  const { currentUser } = useCurrentUser();
  const { commentsForPlace, commentFor, userById, saveComment, removeComment } =
    useData();

  const ownComment = commentFor(currentUser.id, placeId);
  const [draft, setDraft] = useState(ownComment?.body ?? '');
  const [saving, setSaving] = useState(false);

  const others = commentsForPlace(placeId).filter(
    (c) => c.user_id !== currentUser.id,
  );

  const handleSave = async () => {
    const body = draft.trim();
    if (!body) return;
    setSaving(true);
    try {
      await saveComment(currentUser.id, placeId, body);
    } finally {
      setSaving(false);
    }
  };

  const dirty = draft.trim() !== (ownComment?.body ?? '');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Kommentare
      </h3>

      {/* Own comment editor */}
      <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <div className="mb-2 flex items-center gap-2">
          <Avatar userId={currentUser.id} username={currentUser.username} size="sm" />
          <span className="text-sm font-medium text-slate-200">
            {currentUser.username} (du)
          </span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Teile deine Erfahrung mit dieser Sauna…"
          className="w-full resize-none rounded-lg bg-base-900 p-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-1 ring-white/10 focus:ring-accent/60"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          {ownComment && (
            <button
              type="button"
              onClick={() => {
                void removeComment(currentUser.id, placeId);
                setDraft('');
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-red-400"
            >
              Löschen
            </button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={!dirty || saving || !draft.trim()}
            onClick={handleSave}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-base-900 transition-opacity disabled:opacity-40"
          >
            {ownComment ? 'Aktualisieren' : 'Kommentieren'}
          </motion.button>
        </div>
      </div>

      {/* Others' comments */}
      <AnimatePresence initial={false}>
        {others.map((c) => {
          const author = userById(c.user_id);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Avatar
                  userId={c.user_id}
                  username={author?.username ?? '?'}
                  color={author?.color}
                  size="sm"
                />
                <span className="text-sm font-medium text-slate-200">
                  {author?.username ?? 'Unbekannt'}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-300">{c.body}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {others.length === 0 && !ownComment && (
        <p className="text-sm text-slate-500">Noch keine Kommentare.</p>
      )}
    </div>
  );
}
