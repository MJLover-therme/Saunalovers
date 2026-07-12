import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { buildMarkerIcon } from './markerIcon';
import TierPicker from '../ui/TierPicker';
import VisitStatusPicker from '../ui/VisitStatusPicker';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import type { Place } from '../../types';

interface Props {
  place: Place;
  selected: boolean;
  onOpenDetail: (placeId: string) => void;
}

/**
 * A single map marker with an inline popup. The popup lets the current user set
 * their visit status and assign a tier right from the map (one of the two tier
 * editing surfaces), or open the full detail panel.
 */
export default function SaunaMarker({ place, selected, onOpenDetail }: Props) {
  const { currentUser } = useCurrentUser();
  const {
    ratingFor,
    visitStatusFor,
    setRating,
    clearRating,
    setVisit,
    ratingsForPlace,
  } = useData();

  const rating = ratingFor(currentUser.id, place.id);
  const status = visitStatusFor(currentUser.id, place.id);
  const totalRatings = ratingsForPlace(place.id).length;

  const icon = useMemo(
    () => buildMarkerIcon(status, rating?.tier, selected),
    [status, rating?.tier, selected],
  );

  return (
    <Marker
      position={[place.latitude, place.longitude]}
      icon={icon}
      // Clicking a marker opens the full detail panel (with comments) right
      // away; the popup stays available for quick actions on the map.
      eventHandlers={{ click: () => onOpenDetail(place.id) }}
    >
      <Popup>
        <div className="w-60 space-y-3 font-sans">
          <div>
            <h3 className="text-base font-bold text-slate-900">{place.name}</h3>
            {place.address && (
              <p className="text-xs text-slate-500">{place.address}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Dein Status
            </p>
            <VisitStatusPicker
              value={status}
              onChange={(s) => void setVisit(currentUser.id, place.id, s)}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Deine Bewertung
            </p>
            <TierPicker
              value={rating?.tier}
              onChange={(t) => void setRating(currentUser.id, place.id, t)}
              onClear={() => void clearRating(currentUser.id, place.id)}
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(place.id)}
            className="w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Details &amp; Kommentare
            {totalRatings > 0 && ` · ${totalRatings} Bewertung${totalRatings > 1 ? 'en' : ''}`}
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
