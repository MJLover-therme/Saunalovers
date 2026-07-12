import { AnimatePresence, motion } from 'framer-motion';
import TierPicker from '../ui/TierPicker';
import TierBadge from '../ui/TierBadge';
import Avatar from '../ui/Avatar';
import VisitStatusPicker from '../ui/VisitStatusPicker';
import CommentSection from './CommentSection';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import { KARLSRUHE } from '../../lib/config';
import { distanceKm } from '../../lib/distance';

interface Props {
  placeId: string | null;
  onClose: () => void;
}

/** Slide-in detail panel opened from a marker: status, ratings, comments. */
export default function PlaceDetailPanel({ placeId, onClose }: Props) {
  const { currentUser } = useCurrentUser();
  const {
    placeById,
    ratingFor,
    ratingsForPlace,
    visitStatusFor,
    setRating,
    clearRating,
    setVisit,
    userById,
  } = useData();

  const place = placeId ? placeById(placeId) : undefined;

  return (
    <AnimatePresence>
      {place && (
        <>
          <motion.div
            className="fixed inset-0 z-[1500] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass fixed right-0 top-0 z-[1600] flex h-full w-full max-w-md flex-col overflow-y-auto ring-1 ring-white/10"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-base-800/80 p-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-bold text-white">{place.name}</h2>
                {place.address && (
                  <p className="mt-0.5 text-sm text-slate-400">{place.address}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {Math.round(
                    distanceKm(KARLSRUHE, [place.latitude, place.longitude]),
                  )}{' '}
                  km von Karlsruhe
                  {place.source === 'manual' && ' · manuell hinzugefügt'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Your controls */}
              <section className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-sm font-semibold text-slate-200">Deine Angaben</p>
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400">Besuchsstatus</p>
                  <VisitStatusPicker
                    value={visitStatusFor(currentUser.id, place.id)}
                    onChange={(s) => void setVisit(currentUser.id, place.id, s)}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400">Bewertung</p>
                  <TierPicker
                    value={ratingFor(currentUser.id, place.id)?.tier}
                    onChange={(t) => void setRating(currentUser.id, place.id, t)}
                    onClear={() => void clearRating(currentUser.id, place.id)}
                  />
                </div>
              </section>

              {/* All ratings */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Alle Bewertungen
                </h3>
                {ratingsForPlace(place.id).length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Noch keine Bewertungen — sei die/der Erste!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {ratingsForPlace(place.id)
                      .slice()
                      .sort((a, b) => a.tier.localeCompare(b.tier))
                      .map((r) => {
                        const author = userById(r.user_id);
                        return (
                          <li
                            key={r.id}
                            className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5"
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                userId={r.user_id}
                                username={author?.username ?? '?'}
                                color={author?.color}
                                size="sm"
                              />
                              <span className="text-sm text-slate-200">
                                {author?.username ?? 'Unbekannt'}
                                {r.user_id === currentUser.id && (
                                  <span className="text-slate-500"> (du)</span>
                                )}
                              </span>
                            </div>
                            <TierBadge tier={r.tier} size="sm" />
                          </li>
                        );
                      })}
                  </ul>
                )}
              </section>

              {/* Comments */}
              <CommentSection placeId={place.id} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
