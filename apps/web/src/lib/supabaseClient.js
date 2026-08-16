/**
 * Supabase browser client.
 *
 * Reads public env vars exposed by Vite:
 *   - VITE_SUPABASE_URL         (maps to the requested NEXT_PUBLIC_SUPABASE_URL)
 *   - VITE_SUPABASE_ANON_KEY    (maps to NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * The service-role key is NEVER loaded here — it bypasses RLS and must stay
 * server-side (used by the PocketBase sync hook via $os.getenv). The browser
 * only ever uses the anon key, which is safe to publish.
 *
 * When the env vars are missing (Supabase not configured yet), `client` is
 * `null` and the data layer gracefully falls back to PocketBase. See
 * SUPABASE_SETUP.md for how to provide the credentials.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const client = supabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { params: { eventsPerSecond: 5 } },
      })
    : null;

export default client;
