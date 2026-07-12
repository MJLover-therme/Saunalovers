-- Saunalovers core schema
-- Clean separation: users, places, and per-user ratings/comments/visits.
-- No real auth in this build (3 hardcoded profiles + client-side user switch),
-- so RLS is enabled with permissive demo policies for the anon role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  avatar_url  text,
  color       text,
  created_at  timestamptz not null default now()
);

create table public.places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  latitude    double precision not null,
  longitude   double precision not null,
  source      text not null default 'manual',   -- 'osm' | 'manual'
  osm_id      text unique,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  place_id    uuid not null references public.places(id) on delete cascade,
  tier        text not null check (tier in ('S','A','B','C','D','F')),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, place_id)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  place_id    uuid not null references public.places(id) on delete cascade,
  body        text not null check (length(trim(body)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, place_id)
);

create table public.visits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  place_id    uuid not null references public.places(id) on delete cascade,
  status      text not null default 'not_visited'
              check (status in ('not_visited','planned','visited')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, place_id)
);

create index idx_ratings_place on public.ratings(place_id);
create index idx_ratings_user  on public.ratings(user_id);
create index idx_comments_place on public.comments(place_id);
create index idx_visits_user   on public.visits(user_id);

create trigger trg_ratings_updated  before update on public.ratings
  for each row execute function public.set_updated_at();
create trigger trg_comments_updated before update on public.comments
  for each row execute function public.set_updated_at();
create trigger trg_visits_updated   before update on public.visits
  for each row execute function public.set_updated_at();

alter table public.users    enable row level security;
alter table public.places   enable row level security;
alter table public.ratings  enable row level security;
alter table public.comments enable row level security;
alter table public.visits   enable row level security;

-- Demo app has no auth; anon needs full access. The "edit only your own" rule
-- is enforced in the client UI, not by the database.
create policy "demo_all_users"    on public.users    for all to anon using (true) with check (true);
create policy "demo_all_places"   on public.places   for all to anon using (true) with check (true);
create policy "demo_all_ratings"  on public.ratings  for all to anon using (true) with check (true);
create policy "demo_all_comments" on public.comments for all to anon using (true) with check (true);
create policy "demo_all_visits"   on public.visits   for all to anon using (true) with check (true);
