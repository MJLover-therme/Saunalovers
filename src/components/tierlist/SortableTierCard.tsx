import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TierCard from './TierCard';
import type { VisitStatus } from '../../lib/config';

interface Props {
  id: string;
  name: string;
  status?: VisitStatus;
  imageUrl?: string | null;
  onActivate?: () => void;
}

/**
 * Draggable/sortable wrapper around TierCard. A short click (no drag) calls
 * onActivate; holding and moving past the sensor threshold starts a drag — so
 * dnd-kit suppresses the click and reordering wins.
 */
export default function SortableTierCard({
  id,
  name,
  status,
  imageUrl,
  onActivate,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <TierCard
      ref={setNodeRef}
      name={name}
      status={status}
      imageUrl={imageUrl}
      dragging={isDragging}
      title="Auf der Karte anzeigen"
      onClick={() => onActivate?.()}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    />
  );
}
