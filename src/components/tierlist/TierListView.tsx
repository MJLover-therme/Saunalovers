import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import TierRow from './TierRow';
import TierCard from './TierCard';
import Avatar from '../ui/Avatar';
import { TIERS, type Tier } from '../../lib/tiers';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import type { Rating } from '../../types';

type Columns = Record<Tier, string[]>;

function buildColumns(ratings: Rating[]): Columns {
  const cols = Object.fromEntries(TIERS.map((t) => [t, [] as string[]])) as Columns;
  ratings
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((r) => cols[r.tier].push(r.place_id));
  return cols;
}

function findContainer(cols: Columns, id: string): Tier | undefined {
  if ((TIERS as readonly string[]).includes(id)) return id as Tier;
  return TIERS.find((t) => cols[t].includes(id));
}

interface Props {
  viewedUserId: string;
}

/**
 * TierMaker-style list for one user. Editable (drag between rows / reorder /
 * drag to trash to unrate) only when viewing your own list; otherwise read-only.
 */
export default function TierListView({ viewedUserId }: Props) {
  const { currentUser } = useCurrentUser();
  const { ratingsForUser, placeById, visitStatusFor, reorderUserRatings, clearRating, userById } =
    useData();

  const editable = viewedUserId === currentUser.id;
  const userRatings = ratingsForUser(viewedUserId);
  const viewedUser = userById(viewedUserId);

  // Signature so local columns rebuild when the underlying ratings change.
  const signature = useMemo(
    () =>
      userRatings
        .map((r) => `${r.place_id}:${r.tier}:${r.position}`)
        .sort()
        .join('|'),
    [userRatings],
  );

  const [columns, setColumns] = useState<Columns>(() => buildColumns(userRatings));
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setColumns(buildColumns(ratingsForUser(viewedUserId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, viewedUserId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getName = (id: string) => placeById(id)?.name ?? '—';
  const getStatus = (id: string) => visitStatusFor(viewedUserId, id);

  const persist = (cols: Columns) => {
    const next: { place_id: string; tier: Tier; position: number }[] = [];
    TIERS.forEach((t) =>
      cols[t].forEach((pid, idx) =>
        next.push({ place_id: pid, tier: t, position: idx }),
      ),
    );
    void reorderUserRatings(viewedUserId, next);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeContainer = findContainer(columns, activeId);
    const overContainer = findContainer(columns, overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const overIndex = (TIERS as readonly string[]).includes(overId)
        ? overItems.length
        : overItems.indexOf(overId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((i) => i !== activeId),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          activeId,
          ...overItems.slice(insertAt),
        ],
      };
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeId = active.id as string;
    setActiveId(null);
    if (!over) {
      persist(columns);
      return;
    }

    // Dropped on the trash zone → remove the rating.
    if (over.id === '__remove__') {
      const container = findContainer(columns, activeId);
      if (container) {
        const next = {
          ...columns,
          [container]: columns[container].filter((i) => i !== activeId),
        };
        setColumns(next);
        void clearRating(viewedUserId, activeId);
        persist(next);
      }
      return;
    }

    const overId = over.id as string;
    const activeContainer = findContainer(columns, activeId);
    const overContainer = findContainer(columns, overId);
    let finalColumns = columns;

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const items = columns[activeContainer];
      const oldIndex = items.indexOf(activeId);
      const newIndex = (TIERS as readonly string[]).includes(overId)
        ? items.length - 1
        : items.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalColumns = {
          ...columns,
          [activeContainer]: arrayMove(items, oldIndex, newIndex),
        };
        setColumns(finalColumns);
      }
    }
    persist(finalColumns);
  };

  const totalRated = TIERS.reduce((n, t) => n + columns[t].length, 0);

  const rows = (
    <div className="space-y-2">
      {TIERS.map((tier) => (
        <TierRow
          key={tier}
          tier={tier}
          placeIds={columns[tier]}
          editable={editable}
          getName={getName}
          getStatus={getStatus}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {viewedUser && (
          <Avatar
            userId={viewedUserId}
            username={viewedUser.username}
            color={viewedUser.color}
            size="lg"
            ring
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-white">
            Tierliste von {viewedUser?.username ?? '—'}
            {editable && <span className="text-slate-500"> (du)</span>}
          </h2>
          <p className="text-sm text-slate-400">
            {totalRated} bewertete{' '}
            {totalRated === 1 ? 'Sauna' : 'Saunen'}
            {editable ? ' · Ziehen zum Umsortieren' : ' · nur ansehen'}
          </p>
        </div>
      </div>

      {totalRated === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-slate-500">
          {editable
            ? 'Noch keine Bewertungen. Bewerte Saunen auf der Karte, dann erscheinen sie hier zum Sortieren.'
            : 'Diese Person hat noch keine Saunen bewertet.'}
        </div>
      )}

      {editable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {rows}
          <TrashZone visible={activeId !== null} />
          <DragOverlay>
            {activeId ? (
              <TierCard name={getName(activeId)} status={getStatus(activeId)} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        rows
      )}
    </div>
  );
}

/** Drop target that removes a rating; only shown while dragging. */
function TrashZone({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: '__remove__' });
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={setNodeRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className={`mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-semibold transition-colors ${
            isOver
              ? 'border-red-400 bg-red-500/20 text-red-200'
              : 'border-white/15 text-slate-400'
          }`}
        >
          🗑️ Hierher ziehen, um die Bewertung zu entfernen
        </motion.div>
      )}
    </AnimatePresence>
  );
}
