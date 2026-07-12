import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TierCard from './TierCard';
import type { VisitStatus } from '../../lib/config';

interface Props {
  id: string;
  name: string;
  status?: VisitStatus;
}

/** Draggable/sortable wrapper around TierCard for the editable tier list. */
export default function SortableTierCard({ id, name, status }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <TierCard
      ref={setNodeRef}
      name={name}
      status={status}
      dragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    />
  );
}
