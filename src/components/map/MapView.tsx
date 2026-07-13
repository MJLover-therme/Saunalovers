import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, useMap, Marker } from 'react-leaflet';
import L, { type Marker as LeafletMarker } from 'leaflet';
import { useData } from '../../context/DataContext';
import { useActivity } from '../../context/ActivityContext';
import { KARLSRUHE, DEFAULT_ZOOM, RADIUS_KM, VISIT_STATUS, VISIT_STATUS_ORDER } from '../../lib/config';
import type { Place } from '../../types';
import SaunaMarker from './SaunaMarker';

interface Props {
  onOpenDetail: (placeId: string) => void;
  selectedPlaceId: string | null;
  focusPlaceId?: string | null;
  onFocusHandled?: () => void;
  picking?: boolean;
  onPick?: (lat: number, lng: number) => void;
  picked?: [number, number] | null;
}

// Simple crosshair icon for the location being picked when adding a place.
const pickIcon = L.divIcon({
  html: `<div style="width:22px;height:22px;border-radius:50%;border:3px solid #38bdf8;
    background:rgba(56,189,248,.3);box-shadow:0 0 0 4px rgba(56,189,248,.15)"></div>`,
  className: 'sauna-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Handles map clicks while in "pick a location" mode (add-place flow). */
function ClickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Floating button to recenter the map on Karlsruhe. */
function RecenterButton() {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.flyTo(KARLSRUHE, DEFAULT_ZOOM, { duration: 0.8 })}
      className="glass absolute right-3 top-3 z-[1000] rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 shadow-lg ring-1 ring-white/10 transition-colors hover:bg-white/10"
    >
      ⌖ Karlsruhe
    </button>
  );
}

/**
 * Flies to a requested sauna (e.g. clicked from the tier list) and opens its
 * popup, then clears the request.
 */
function FocusController({
  focusPlaceId,
  places,
  markerRefs,
  onFocusHandled,
}: {
  focusPlaceId?: string | null;
  places: Place[];
  markerRefs: React.MutableRefObject<Record<string, LeafletMarker | null>>;
  onFocusHandled?: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusPlaceId) return;
    const place = places.find((p) => p.id === focusPlaceId);
    if (
      !place ||
      !map ||
      !Number.isFinite(place.latitude) ||
      !Number.isFinite(place.longitude)
    ) {
      onFocusHandled?.();
      return;
    }
    try {
      map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 13), {
        duration: 0.9,
      });
    } catch {
      /* map not ready — ignore */
    }
    const t = setTimeout(() => {
      try {
        markerRefs.current[focusPlaceId]?.openPopup();
      } catch {
        /* marker gone — ignore */
      }
      onFocusHandled?.();
    }, 950);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPlaceId]);
  return null;
}

export default function MapView({
  onOpenDetail,
  selectedPlaceId,
  focusPlaceId,
  onFocusHandled,
  picking,
  onPick,
  picked,
}: Props) {
  const { places } = useData();
  const { unreadByPlace, markSeen } = useActivity();
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({});

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={KARLSRUHE}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 50 km radius of interest around Karlsruhe */}
        <Circle
          center={KARLSRUHE}
          radius={RADIUS_KM * 1000}
          pathOptions={{
            color: '#38bdf8',
            weight: 1.5,
            fillColor: '#38bdf8',
            fillOpacity: 0.05,
            dashArray: '6 6',
          }}
        />

        {places.map((place) => (
          <SaunaMarker
            key={place.id}
            place={place}
            selected={place.id === selectedPlaceId || place.id === focusPlaceId}
            hasUnread={unreadByPlace.has(place.id)}
            onOpenDetail={onOpenDetail}
            onSeen={markSeen}
            registerMarker={(id, m) => {
              markerRefs.current[id] = m;
            }}
          />
        ))}

        {picking && <ClickHandler onPick={onPick} />}
        {picked && <Marker position={picked} icon={pickIcon} />}

        <FocusController
          focusPlaceId={focusPlaceId}
          places={places}
          markerRefs={markerRefs}
          onFocusHandled={onFocusHandled}
        />
        <RecenterButton />
      </MapContainer>

      {/* Legend */}
      <div className="glass pointer-events-none absolute bottom-6 left-3 z-[1000] rounded-xl px-3 py-2.5 text-xs shadow-lg ring-1 ring-white/10">
        <p className="mb-1.5 font-semibold text-slate-200">Dein Besuchsstatus</p>
        <ul className="space-y-1">
          {VISIT_STATUS_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-2 text-slate-300">
              <span
                className="h-3 w-3 rounded-full ring-1 ring-white/40"
                style={{ backgroundColor: VISIT_STATUS[s].color }}
              />
              {VISIT_STATUS[s].label}
            </li>
          ))}
        </ul>
      </div>

      {picking && (
        <div className="glass absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-accent-soft shadow-lg ring-1 ring-accent/30">
          📍 Tippe auf die Karte, um den Ort zu setzen
        </div>
      )}
    </div>
  );
}
