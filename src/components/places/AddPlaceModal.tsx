import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import { KARLSRUHE } from '../../lib/config';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (placeId: string) => void;
}

const pinIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;border:3px solid #38bdf8;
    background:rgba(56,189,248,.35);box-shadow:0 0 0 4px rgba(56,189,248,.15)"></div>`,
  className: 'sauna-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function PickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Modal to add a new sauna: name, address, and a click-to-place mini map. */
export default function AddPlaceModal({ open, onClose, onCreated }: Props) {
  const { currentUser } = useCurrentUser();
  const { addPlace } = useData();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setAddress('');
    setPos(null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!name.trim() || !pos) return;
    setSaving(true);
    setError(null);
    try {
      const place = await addPlace({
        name: name.trim(),
        address: address.trim() || null,
        latitude: pos[0],
        longitude: pos[1],
        created_by: currentUser.id,
      });
      reset();
      onClose();
      onCreated?.(place.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[1700] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <div className="fixed inset-0 z-[1800] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="glass w-full max-w-lg overflow-hidden rounded-2xl ring-1 ring-white/10"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h2 className="text-lg font-bold text-white">Neue Sauna hinzufügen</h2>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z. B. Therme Erlebniswelt"
                    className="w-full rounded-lg bg-base-900 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-accent/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Adresse
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Straße, PLZ Ort"
                    className="w-full rounded-lg bg-base-900 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-accent/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Standort * — auf die Karte tippen
                  </label>
                  <div className="h-52 overflow-hidden rounded-xl ring-1 ring-white/10">
                    <MapContainer
                      center={KARLSRUHE}
                      zoom={9}
                      className="h-full w-full"
                    >
                      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <PickHandler onPick={(lat, lng) => setPos([lat, lng])} />
                      {pos && <Marker position={pos} icon={pinIcon} />}
                    </MapContainer>
                  </div>
                  {pos && (
                    <p className="mt-1 text-xs text-slate-500">
                      {pos[0].toFixed(5)}, {pos[1].toFixed(5)}
                    </p>
                  )}
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>

              <div className="flex justify-end gap-2 border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                >
                  Abbrechen
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={!name.trim() || !pos || saving}
                  onClick={submit}
                  className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base-900 transition-opacity disabled:opacity-40"
                >
                  {saving ? 'Speichern…' : 'Hinzufügen'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
