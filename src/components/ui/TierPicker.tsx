import { motion } from 'framer-motion';
import { TIERS, TIER_COLORS, TIER_TEXT_COLOR, type Tier } from '../../lib/tiers';

interface Props {
  value: Tier | undefined;
  onChange: (tier: Tier) => void;
  onClear?: () => void;
  disabled?: boolean;
}

/**
 * Row of S/A/B/C/D/F buttons for assigning a tier. Shared by the map marker
 * popup and the place detail panel. Clicking the active tier clears it.
 */
export default function TierPicker({ value, onChange, onClear, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TIERS.map((tier) => {
        const active = value === tier;
        return (
          <motion.button
            key={tier}
            type="button"
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.88 }}
            whileHover={disabled ? undefined : { scale: 1.08 }}
            onClick={() => {
              if (disabled) return;
              if (active && onClear) onClear();
              else onChange(tier);
            }}
            className={`w-9 h-9 rounded-lg font-extrabold text-sm transition-shadow ${
              active ? 'ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            style={{ backgroundColor: TIER_COLORS[tier], color: TIER_TEXT_COLOR }}
            aria-pressed={active}
            aria-label={`Tier ${tier}`}
          >
            {tier}
          </motion.button>
        );
      })}
    </div>
  );
}
