// App-wide constants derived from the PRD.

// The map opens centered on Karlsruhe with a 50 km radius of interest.
export const KARLSRUHE: [number, number] = [49.0069, 8.4037];
export const DEFAULT_ZOOM = 10;
export const RADIUS_KM = 50;

// Per-user visit status: each has a fixed, distinct color (PRD marker legend).
export type VisitStatus = 'not_visited' | 'planned' | 'visited';

export const VISIT_STATUS: Record<
  VisitStatus,
  { label: string; color: string; emoji: string }
> = {
  not_visited: { label: 'Noch nicht besucht', color: '#22c55e', emoji: '🟢' },
  planned: { label: 'Geplanter Besuch', color: '#f59e0b', emoji: '🟡' },
  visited: { label: 'Bereits besucht', color: '#3b82f6', emoji: '🔵' },
};

export const VISIT_STATUS_ORDER: VisitStatus[] = [
  'not_visited',
  'planned',
  'visited',
];
