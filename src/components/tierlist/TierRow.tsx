import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableTierCard from './SortableTierCard';
import TierCard from './TierCard';
import { TIER_COLORS, TIER_TEXT_COLOR, type Tier } from '../../lib/tiers';
import type { VisitStatus } from '../../lib/config';

interface Props {
  tier: Tier;
  placeIds: string[];
  editable: boolean;
  getName: (placeId: string) => string;
  getStatus: (placeId: string) => VisitStatus | undefined;
  getImage: (placeId: string) => string | null;
  onGoToSauna: (placeId: string) => void;
}

/** One TierMaker-style row: a colored label block + its cards (droppable). */
export default function TierRow({
  tier,
  placeIds,
  editable,
  getName,
  getStatus,
  getImage,
  onGoToSauna,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: tier, disabled: !editable });

  return (
    <div className="flex overflow-hidden rounded-xl ring-1 ring-white/10">
      {/* Colored tier label */}
      <div
        className="flex w-14 shrink-0 items-center justify-center text-2xl font-black"
        style={{ backgroundColor: TIER_COLORS[tier], color: TIER_TEXT_COLOR }}
      >
        {tier}
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[64px] flex-1 flex-wrap content-start gap-2 p-2 transition-colors ${
          isOver ? 'bg-accent/10' : 'bg-base-800'
        }`}
      >
        {editable ? (
          <SortableContext items={placeIds} strategy={rectSortingStrategy}>
            {placeIds.map((id) => (
              <SortableTierCard
                key={id}
                id={id}
                name={getName(id)}
                status={getStatus(id)}
                imageUrl={getImage(id)}
                onActivate={() => onGoToSauna(id)}
              />
            ))}
          </SortableContext>
        ) : (
          placeIds.map((id) => (
            <TierCard
              key={id}
              name={getName(id)}
              status={getStatus(id)}
              imageUrl={getImage(id)}
              title="Auf der Karte anzeigen"
              onClick={() => onGoToSauna(id)}
            />
          ))
        )}

        {placeIds.length === 0 && (
          <span className="self-center px-2 text-xs text-slate-600">
            {editable ? 'Saunen hierher ziehen' : '—'}
          </span>
        )}
      </div>
    </div>
  );
}
