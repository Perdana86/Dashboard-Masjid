/**
 * Database source toggle.
 *
 * The mosque dashboard can read its data from either PocketBase (default,
 * source of truth) or Supabase (one-way synced from PocketBase). The active
 * source is stored in localStorage so it survives reloads, and a small
 * pub/sub lets the app react when the admin flips the switch.
 *
 * Admin writes always go to PocketBase regardless of this setting — the
 * sync hook (pb_hooks/supabase_sync.pb.js) then pushes the change to Supabase.
 */

export const DB_POCKETBASE = 'pocketbase';
export const DB_SUPABASE = 'supabase';
const STORAGE_KEY = 'masjid_db_source';

function readInitial() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === DB_SUPABASE ? DB_SUPABASE : DB_POCKETBASE;
    } catch (_) {
        return DB_POCKETBASE;
    }
}

let current = readInitial();
const listeners = new Set();

export function getDbSource() {
    return current;
}

export function isSupabaseActive() {
    return current === DB_SUPABASE;
}

export function setDbSource(next) {
    const value = next === DB_SUPABASE ? DB_SUPABASE : DB_POCKETBASE;
    current = value;
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch (_) {
        /* ignore quota / privacy errors */
    }
    listeners.forEach((fn) => {
        try {
            fn(value);
        } catch (_) {
            /* never let a listener throw break the toggle */
        }
    });
}

export function subscribeDbSource(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
