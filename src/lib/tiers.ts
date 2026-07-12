// Single source of truth for the tier scale and its TierMaker-style colors.
// Used by the map popup, the detail panel, and the drag-and-drop tier list so
// colors stay consistent across the whole app.

export const TIERS = ['S', 'A', 'B', 'C', 'D', 'F'] as const;
export type Tier = (typeof TIERS)[number];

// Classic TierMaker default row colors (S..F). Rows are light, so text is dark.
export const TIER_COLORS: Record<Tier, string> = {
  S: '#ff7f7f',
  A: '#ffbf7f',
  B: '#ffdf7f',
  C: '#ffff7f',
  D: '#bfff7f',
  F: '#7fff7f',
};

// Dark ink reads best on the light tier rows.
export const TIER_TEXT_COLOR = '#1a1a1a';

export function isTier(value: string | null | undefined): value is Tier {
  return !!value && (TIERS as readonly string[]).includes(value);
}
