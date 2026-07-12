import { createClient } from '@supabase/supabase-js';

// The only place the app touches Supabase directly. Everything else goes
// through hooks so the data layer stays swappable.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
