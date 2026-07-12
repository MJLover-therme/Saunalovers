-- Photo thumbnail for a place (sourced from Wikimedia Commons; nullable).
alter table public.places add column if not exists image_url text;
