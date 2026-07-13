import L from 'leaflet';
import { VISIT_STATUS, type VisitStatus } from '../../lib/config';
import { TIER_COLORS, TIER_TEXT_COLOR, type Tier } from '../../lib/tiers';

// Builds a teardrop pin as a Leaflet divIcon. Pin color = current user's visit
// status for that place; if they've rated it, the assigned tier letter shows in
// a badge on the pin. Selected markers get a subtle glow ring.
export function buildMarkerIcon(
  status: VisitStatus,
  tier: Tier | undefined,
  selected: boolean,
  hasUnread = false,
): L.DivIcon {
  const color = VISIT_STATUS[status].color;

  // A pulsing "neu" chat bubble above the pin when another user has posted
  // activity here that the current user hasn't opened yet.
  const newBubble = hasUnread
    ? `<div class="sl-new-bubble">neu</div>`
    : '';
  const badge = tier
    ? `<span style="position:absolute;top:2px;left:50%;transform:translateX(-50%);
         width:16px;height:16px;border-radius:5px;display:flex;align-items:center;
         justify-content:center;font:700 10px/1 Inter,sans-serif;
         background:${TIER_COLORS[tier]};color:${TIER_TEXT_COLOR};
         box-shadow:0 1px 2px rgba(0,0,0,.4)">${tier}</span>`
    : '';

  const glow = selected
    ? 'filter:drop-shadow(0 0 6px rgba(255,255,255,.9));'
    : 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.4));';

  const html = `
    <div style="position:relative;width:32px;height:42px;${glow}">
      ${newBubble}
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1C8 1 1.5 7.4 1.5 15.3 1.5 26 16 41 16 41S30.5 26 30.5 15.3C30.5 7.4 24 1 16 1Z"
          fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="15" r="5.5" fill="#fff" fill-opacity="0.9"/>
      </svg>
      ${badge}
    </div>`;

  return L.divIcon({
    html,
    className: 'sauna-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}
