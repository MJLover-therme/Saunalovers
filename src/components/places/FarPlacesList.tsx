import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import TierBadge from '../ui/TierBadge';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import { KARLSRUHE, RADIUS_KM, VISIT_STATUS } from '../../lib/config';
import { distanceKm } from '../../lib/distance';

interface Props {
  onOpenDetail: (placeId: string) => void;
}

/**
 * List view. With no search it shows saunas OUTSIDE the 50 km radius (sorted by
 * distance), per the PRD. Typing searches across all saunas by name/address.
 */
export default function FarPlacesList({ onOpenDetail }: Props) {
  const { places, ratingFor, visitStatusFor } = useData();
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places
      .map((p) => ({
        place: p,
        dist: distanceKm(KARLSRUHE, [p.latitude, p.longitude]),
      }))
      .filter(({ place, dist }) =>
        q
          ? place.name.toLowerCase().includes(q) ||
            (place.address ?? '').toLowerCase().includes(q)
          : dist > RADIUS_KM,
      )
      .sort((a, b) => a.dist - b.dist);
  }, [places, query]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Entfernte Orte</h2>
        <p className="text-sm text-slate-400">
          Saunen &amp; Thermen außerhalb des 50-km-Radius um Karlsruhe — oder
          suche alle Orte.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Sauna suchen (Name oder Adresse)…"
        className="mb-4 w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-1 ring-white/10 focus:ring-accent/60"
      />

      <p className="mb-2 text-xs text-slate-500">{list.length} Orte</p>

      <ul className="space-y-2">
        {list.map(({ place, dist }, i) => {
          const rating = ratingFor(currentUser.id, place.id);
          const status = visitStatusFor(currentUser.id, place.id);
          return (
            <motion.li
              key={place.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
            >
              <button
                type="button"
                onClick={() => onOpenDetail(place.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-left ring-1 ring-white/5 transition-colors hover:bg-white/[0.07]"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: VISIT_STATUS[status].color }}
                  title={VISIT_STATUS[status].label}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {place.name}
                  </p>
                  {place.address && (
                    <p className="truncate text-xs text-slate-500">
                      {place.address}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {Math.round(dist)} km
                </span>
                {rating && <TierBadge tier={rating.tier} size="sm" />}
              </button>
            </motion.li>
          );
        })}
        {list.length === 0 && (
          <li className="py-10 text-center text-sm text-slate-500">
            Keine Orte gefunden.
          </li>
        )}
      </ul>
    </div>
  );
}
