import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapView from './components/map/MapView';
import PlaceDetailPanel from './components/detail/PlaceDetailPanel';
import UserTierlistsView from './components/users/UserTierlistsView';
import FarPlacesList from './components/places/FarPlacesList';
import AddPlaceModal from './components/places/AddPlaceModal';
import UserSwitcher from './components/users/UserSwitcher';
import { useData } from './context/DataContext';

type View = 'map' | 'tierlists' | 'far';

const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'map', label: 'Karte', icon: '🗺️' },
  { id: 'tierlists', label: 'Tierlisten', icon: '🏆' },
  { id: 'far', label: 'Entfernte Orte', icon: '📍' },
];

export default function App() {
  const { loading, error } = useData();
  const [view, setView] = useState<View>('map');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="z-[1000] flex items-center gap-4 border-b border-white/10 bg-base-800/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <img src="/sauna.svg" alt="" className="h-8 w-8" />
          <span className="hidden text-lg font-extrabold tracking-tight text-white sm:block">
            Sauna<span className="text-accent">lovers</span>
          </span>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          {TABS.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`relative rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
                  active ? 'text-base-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-base-900 shadow-lg shadow-accent/20 transition-shadow hover:shadow-accent/40 sm:px-4"
          >
            <span className="text-base leading-none">＋</span>
            <span className="hidden sm:inline">Sauna</span>
          </motion.button>
          <UserSwitcher />
        </div>
      </header>

      {/* Main area */}
      <main className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-base-900">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
            <p className="text-sm text-slate-400">Saunen werden geladen…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-base-900 p-6 text-center">
            <p className="text-lg font-semibold text-red-400">
              Daten konnten nicht geladen werden
            </p>
            <p className="max-w-md text-sm text-slate-400">{error}</p>
          </div>
        )}

        {/* Views. Map stays mounted-friendly; others scroll. */}
        {view === 'map' && (
          <div className="absolute inset-0">
            <MapView
              onOpenDetail={setSelectedPlaceId}
              selectedPlaceId={selectedPlaceId}
            />
          </div>
        )}

        {view !== 'map' && (
          <div className="absolute inset-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'tierlists' && <UserTierlistsView />}
                {view === 'far' && (
                  <FarPlacesList onOpenDetail={setSelectedPlaceId} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Overlays */}
      <PlaceDetailPanel
        placeId={selectedPlaceId}
        onClose={() => setSelectedPlaceId(null)}
      />
      <AddPlaceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => setSelectedPlaceId(id)}
      />
    </div>
  );
}
