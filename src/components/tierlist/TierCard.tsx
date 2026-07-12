import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { VISIT_STATUS, type VisitStatus } from '../../lib/config';

interface Props extends HTMLAttributes<HTMLDivElement> {
  name: string;
  status?: VisitStatus;
  dragging?: boolean;
  style?: CSSProperties;
}

/**
 * Presentational sauna card used inside tier rows. Kept dumb so it can be reused
 * by the sortable wrapper, the drag overlay, and the read-only view alike.
 */
const TierCard = forwardRef<HTMLDivElement, Props>(function TierCard(
  { name, status, dragging, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      style={style}
      className={`flex touch-none select-none items-center gap-2 rounded-lg bg-base-700 px-3 py-2 text-sm font-medium text-slate-100 shadow-md ring-1 ring-white/10 ${
        dragging ? 'opacity-40' : ''
      } cursor-grab active:cursor-grabbing`}
      {...rest}
    >
      {status && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: VISIT_STATUS[status].color }}
          title={VISIT_STATUS[status].label}
        />
      )}
      <span className="max-w-[180px] truncate">{name}</span>
    </div>
  );
});

export default TierCard;
