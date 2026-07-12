import { TIER_COLORS, TIER_TEXT_COLOR, type Tier } from '../../lib/tiers';

interface Props {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-11 h-11 text-lg',
};

/** A single colored tier chip (S/A/B/C/D/F) using the shared TierMaker colors. */
export default function TierBadge({ tier, size = 'md' }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-extrabold shadow-sm ${SIZES[size]}`}
      style={{ backgroundColor: TIER_COLORS[tier], color: TIER_TEXT_COLOR }}
    >
      {tier}
    </span>
  );
}
