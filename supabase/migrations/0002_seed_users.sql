-- Three fixed demo profiles. IDs are deterministic so the frontend can
-- reference them directly (see src/context/CurrentUserContext.tsx).
insert into public.users (id, username, color, avatar_url) values
  ('11111111-1111-1111-1111-111111111111', 'Jannik', '#38bdf8', null),
  ('22222222-2222-2222-2222-222222222222', 'Mert', '#fb923c', null),
  ('33333333-3333-3333-3333-333333333333', 'Tim', '#a78bfa', null)
on conflict (id) do nothing;

-- Places are seeded separately from the OpenStreetMap Overpass API
-- (saunas & thermal baths within ~120 km of Karlsruhe). See README.
