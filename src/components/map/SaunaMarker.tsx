import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { buildMarkerIcon } from './markerIcon';
import TierPicker from '../ui/TierPicker';
import TierBadge from '../ui/TierBadge';
import VisitStatusPicker from '../ui/VisitStatusPicker';
import Avatar from '../ui/Avatar';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import type { Place } from '../../types';

interface Props {
  place: Place;
  selected: boolean;
  hasUnread: boolean;
  onOpenDetail: (placeId: string) => void;
  onSeen: (placeId: string) => void;
  registerMarker: (placeId: string, marker: LeafletMarker | null) => void;
}

/**
 * A single map marker with an inline popup. The popup shows the other users'
 * comments as chat bubbles, lets the current user set their visit status and
 * tier right from the map, or open the full detail panel.
 */
export default function SaunaMarker({
  place,
  selected,
  hasUnread,
  onOpenDetail,
  onSeen,
  registerMarker,
}: Props) {
  const { currentUser } = useCurrentUser();
  const {
    ratingFor,
    visitStatusFor,
    setRating,
    clearRating,
    setVisit,
    ratingsForPlace,
    commentsForPlace,
    userById,
  } = useData();

  const rating = ratingFor(currentUser.id, place.id);
  const status = visitStatusFor(currentUser.id, place.id);
  const totalRatings = ratingsForPlace(place.id).length;
  const otherComments = commentsForPlace(place.id).filter(
    (c) => c.user_id !== currentUser.id,
  );

  const icon = useMemo(
    () => buildMarkerIcon(status, rating?.tier, selected, hasUnread),
    [status, rating?.tier, selected, hasUnread],
  );

  return (
    <Marker
      position={[place.latitude, place.longitude]}
      icon={icon}
      ref={(m) => registerMarker(place.id, m)}
      // Opening the popup means the user has read this place's activity.
      eventHandlers={{ popupopen: () => onSeen(place.id) }}
    >
      <Popup>
        <div className="w-64 space-y-3 font-sans">
          <div>
            <h3 className="text-base font-bold text-slate-900">{place.name}</h3>
            {place.address && (
              <p className="text-xs text-slate-500">{place.address}</p>
            )}
          </div>

          {/* Other people's comments as chat bubbles */}
          {otherComments.length > 0 && (
            <div className="space-y-1.5">
              {otherComments.map((c) => {
                const author = userById(c.user_id);
                return (
                  <div key={c.id} className="flex items-start gap-1.5">
                    <Avatar
                      userId={c.user_id}
                      username={author?.username ?? '?'}
                      color={author?.color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-slate-100 px-2.5 py-1.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        {author?.username ?? 'Unbekannt'}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-xs leading-snug text-slate-600">
                        {c.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Deine Bewertung
              </p>
              {rating && <TierBadge tier={rating.tier} size="sm" />}
            </div>
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
