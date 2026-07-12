import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { VISIT_STATUS, type VisitStatus } from '../../lib/config';

interface Props extends HTMLAttributes<HTMLDivElement> {
  name: string;
  status?: VisitStatus;
  imageUrl?: string | null;
  dragging?: boolean;
  overlay?: boolean;
  style?: CSSProperties;
}

/**
 * Presentational sauna card used inside tier rows: photo thumbnail (or a 🧖
 * placeholder tile when no photo is known), visit-status dot, and name. Kept
 * dumb so the sortable wrapper, drag overlay, and read-only view all reuse it.
 */
const TierCard = forwardRef<HTMLDivElement, Props>(function TierCard(
  { name, status, imageUrl, dragging, overlay, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      style={style}
      className={`flex touch-none select-none items-center gap-2 rounded-lg bg-base-700 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-100 shadow-md ring-1 ring-white/10 ${
        dragging ? 'opacity-40' : ''
      } ${overlay ? 'rotate-2 scale-105 shadow-2xl ring-accent/60' : ''} cursor-grab active:cursor-grabbing`}
      {...rest}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-white/15"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-base-600 text-base ring-1 ring-white/10">
          🧖
        </span>
      )}
      <span className="flex min-w-0 items-center gap-1.5">
        {status && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: VISIT_STATUS[status].color }}
            title={VISIT_STATUS[status].label}
          />
        )}
        <span className="max-w-[160px] truncate">{name}</span>
      </span>
    </div>
  );
});

export default TierCard;
