import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  MeasuringStrategy,
  type CollisionDetection,
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

// Prefer whatever the pointer is actually over; fall back to rect overlap.
// Much more predictable across rows than closestCorners.
const collisionDetection: CollisionDetection = (args) => {
  const withPointer = pointerWithin(args);
  if (withPointer.length > 0) return withPointer;
  return rectIntersection(args);
};

interface Props {
  viewedUserId: string;
  onGoToSauna: (placeId: string) => void;
}

/**
 * TierMaker-style list for one user. Editable (drag between rows / reorder /
 * drag to trash to unrate) only when viewing your own list; otherwise read-only.
 * Short-clicking a card jumps to that sauna on the map.
 */
export default function TierListView({ viewedUserId, onGoToSauna }: Props) {
  const { currentUser } = useCurrentUser();
  const {
    ratingsForUser,
    placeById,
    visitStatusFor,
    reorderUserRatings,
    clearRating,
    userById,
  } = useData();

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

  const [columns, setColumnsState] = useState<Columns>(() =>
    buildColumns(userRatings),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Ref mirrors columns so drag handlers always persist the latest layout,
  // never a stale render's closure.
  const columnsRef = useRef(columns);
  const draggingRef = useRef(false);

  const setColumns = useCallback(
    (updater: (prev: Columns) => Columns) => {
      setColumnsState((prev) => {
        const next = updater(prev);
        columnsRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    // Don't clobber the local layout while a drag is in flight — the server
    // echo of our own persist would otherwise snap cards around mid-drag.
    if (draggingRef.current) return;
    const next = buildColumns(ratingsForUser(viewedUserId));
    columnsRef.current = next;
    setColumnsState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, viewedUserId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const getName = (id: string) => placeById(id)?.name ?? '—';
  const getStatus = (id: string) => visitStatusFor(viewedUserId, id);
  const getImage = (id: string) => placeById(id)?.image_url ?? null;

  const persist = (cols: Columns) => {
    const next: { place_id: string; tier: Tier; position: number }[] = [];
    TIERS.forEach((t) =>
      cols[t].forEach((pid, idx) =>
        next.push({ place_id: pid, tier: t, position: idx }),
      ),
    );
    void reorderUserRatings(viewedUserId, next);
  };

  const handleDragStart = (e: DragStartEvent) => {
    draggingRef.current = true;
    setActiveId(e.active.id as string);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeKey = active.id as string;
    const overKey = over.id as string;
    if (overKey === '__remove__') return;

    setColumns((prev) => {
      const activeContainer = findContainer(prev, activeKey);
      const overContainer = findContainer(prev, overKey);
      if (!activeContainer || !overContainer || activeContainer === overContainer)
        return prev;
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const overIndex = (TIERS as readonly string[]).includes(overKey)
        ? overItems.length
        : overItems.indexOf(overKey);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((i) => i !== activeKey),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          activeKey,
          ...overItems.slice(insertAt),
        ],
      };
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeKey = active.id as string;
    setActiveId(null);
    draggingRef.current = false;

    // Dropped on the trash zone → remove the rating entirely.
    if (over?.id === '__remove__') {
      setColumns((prev) => {
        const container = findContainer(prev, activeKey);
        if (!container) return prev;
        return {
          ...prev,
          [container]: prev[container].filter((i) => i !== activeKey),
        };
      });
      void clearRating(viewedUserId, activeKey);
      persist(columnsRef.current);
      return;
    }

    if (over) {
      const overKey = over.id as string;
      setColumns((prev) => {
        const activeContainer = findContainer(prev, activeKey);
        const overContainer = findContainer(prev, overKey);
        if (
          !activeContainer ||
          !overContainer ||
          activeContainer !== overContainer
        )
          return prev;
        const items = prev[activeContainer];
        const oldIndex = items.indexOf(activeKey);
        const newIndex = (TIERS as readonly string[]).includes(overKey)
          ? items.length - 1
          : items.indexOf(overKey);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev;
        return {
          ...prev,
          [activeContainer]: arrayMove(items, oldIndex, newIndex),
        };
      });
    }
    persist(columnsRef.current);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    draggingRef.current = false;
    // Restore the last saved layout.
    const next = buildColumns(ratingsForUser(viewedUserId));
    columnsRef.current = next;
    setColumnsState(next);
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
          getImage={getImage}
          onGoToSauna={onGoToSauna}
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
          collisionDetection={collisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {rows}
          <TrashZone visible={activeId !== null} />
          <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
            {activeId ? (
              <TierCard
                name={getName(activeId)}
                status={getStatus(activeId)}
                imageUrl={getImage(activeId)}
                overlay
              />
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
