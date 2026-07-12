import { motion } from 'framer-motion';
import {
  VISIT_STATUS,
  VISIT_STATUS_ORDER,
  type VisitStatus,
} from '../../lib/config';

interface Props {
  value: VisitStatus;
  onChange: (status: VisitStatus) => void;
  disabled?: boolean;
}

/** Three-way visit status selector (Unbesucht / Geplant / Besucht). */
export default function VisitStatusPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {VISIT_STATUS_ORDER.map((status) => {
        const meta = VISIT_STATUS[status];
        const active = value === status;
        return (
          <motion.button
            key={status}
            type="button"
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.94 }}
            onClick={() => !disabled && onChange(status)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? 'border-transparent text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            style={active ? { backgroundColor: meta.color } : undefined}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: active ? '#fff' : meta.color }}
            />
            {meta.label}
          </motion.button>
        );
      })}
    </div>
  );
}
