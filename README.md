# 🧖 Saunalovers

A community web app to discover, visit-track and **tier-rate** saunas & thermal baths around Karlsruhe. Map-first, with per-user TierMaker-style tier lists you can compare across friends.

Built for three friends (Jannik, Mert, Tim). There is **no per-user auth** — you pick a profile and enter a single **shared password** to log in.

## ✨ Features

- **Interactive map** (React-Leaflet + OpenStreetMap) centered on Karlsruhe with a 50 km radius, showing all known saunas as status-colored markers.
- **Per-user visit status** — 🟢 not visited · 🟡 planned · 🔵 visited.
- **Tier ratings (S/A/B/C/D/F)** with the classic TierMaker colors. Two ways to rate:
  - inline from a **map marker popup**, and
  - a dedicated **drag-and-drop Tier List view** (drag saunas between rows, reorder, or drag to the trash to un-rate).
- **Everyone's ratings shown together** per place — no global average.
- **Public comments** (one editable comment per user per place).
- **User overview** — view anyone's tier list (read-only unless it's your own).
- **Add saunas** manually with a click-to-place mini map.
- **List view** of saunas outside the 50 km radius, plus search across all places.

## 🧱 Tech stack

| Layer     | Choice |
|-----------|--------|
| Frontend  | React 18 + TypeScript + Vite |
| Styling   | Tailwind CSS |
| Animation | Framer Motion |
| Map       | React-Leaflet + OpenStreetMap tiles |
| Drag & drop | dnd-kit |
| Database  | Supabase (PostgreSQL) |
| Hosting   | Vercel |

The code is layered: **UI** (`components/`) → **logic** (`context/`) → **data access** (`lib/api.ts`, `lib/supabaseClient.ts`). Components never call Supabase directly.

## 📁 Structure

```
src/
  lib/          supabaseClient, api, tiers (colors), config, distance
  types/        domain types
  context/      CurrentUserContext (profile switch), DataContext (store)
  components/
    map/        MapView, SaunaMarker, markerIcon
    detail/     PlaceDetailPanel, CommentSection
    tierlist/   TierListView (dnd), TierRow, TierCard, SortableTierCard
    users/      UserSwitcher, UserTierlistsView
    places/     AddPlaceModal, FarPlacesList
    ui/         TierBadge, Avatar, TierPicker, VisitStatusPicker
supabase/
  migrations/   schema + seed SQL (mirrors what's applied to the project)
```

## 🚀 Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + key
npm run dev                  # http://localhost:5173
```

Environment variables (`.env.local`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

## ☁️ Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → import the GitHub repo**. Framework preset is auto-detected as Vite.
3. Add the two environment variables above under **Settings → Environment Variables**.
4. Deploy. `vercel.json` already sets the build command, output dir and SPA rewrite.

## 🔐 Security note

This build has **no authentication** by design (three shared profiles). Supabase Row Level Security is enabled but intentionally permissive for the `anon` role, and the "you can only edit your own ratings" rule is enforced in the UI, not the database. Fine for a private demo among friends; add real auth before exposing it publicly.

## 🗄️ Database schema

`users`, `places`, `ratings`, `comments`, `visits` — see `supabase/migrations/`. Ratings and comments are unique per `(user, place)`; visits track per-user status. Sauna locations were seeded from the OpenStreetMap Overpass API within ~120 km of Karlsruhe.
