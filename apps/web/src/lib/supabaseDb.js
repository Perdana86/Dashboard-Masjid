/**
 * Supabase read functions — mirror the PocketBase fetch helpers in masjid.js.
 *
 * Each function returns data in the SAME shape the app expects from
 * PocketBase records, so the routed fetch helpers in masjid.js can swap
 * sources transparently:
 *   - rows are plain objects keyed by the same column names as the PB fields
 *   - file columns hold a ready-to-use URL string (the sync hook stores the
 *     full PocketBase file URL there), so `fileUrl(record, record.image)`
 *     returns it as-is
 *   - `created` / `updated` are ISO strings (fine for sorting)
 *
 * Writes are NOT implemented here on purpose: admin edits go to PocketBase
 * and the one-way sync hook pushes them to Supabase.
 */

import supabase from '@/lib/supabaseClient';

function requireClient() {
    if (!supabase) {
        throw new Error('Supabase belum dikonfigurasi. Lihat SUPABASE_SETUP.md.');
    }
    return supabase;
}

function orderBoth(query) {
    // Replicates PocketBase `{ sort: 'position,created' }`.
    return query.order('position', { ascending: true, nullsFirst: false }).order('created', { ascending: true });
}

export async function fetchSettingsSupa() {
    const s = requireClient();
    const { data, error } = await s
        .from('settings')
        .select('*')
        .order('created', { ascending: true })
        .limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
}

export async function fetchSlidesSupa() {
    const s = requireClient();
    const { data, error } = await orderBoth(s.from('slides').select('*'));
    if (error) throw error;
    return data || [];
}

export async function fetchDashboardSlidesSupa() {
    const s = requireClient();
    const { data, error } = await orderBoth(s.from('dashboard_slides').select('*'));
    if (error) throw error;
    return data || [];
}

export async function fetchBioSupa() {
    const s = requireClient();
    const { data, error } = await s
        .from('bio')
        .select('*')
        .order('created', { ascending: true })
        .limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
}

export async function fetchBioLinksSupa() {
    const s = requireClient();
    const { data, error } = await orderBoth(s.from('bio_links').select('*'));
    if (error) throw error;
    return data || [];
}

export async function fetchActivitiesSupa() {
    const s = requireClient();
    const { data, error } = await orderBoth(s.from('activities').select('*'));
    if (error) throw error;
    return data || [];
}

export async function fetchNotificationsSupa() {
    const s = requireClient();
    const { data, error } = await s
        .from('notifications')
        .select('*')
        .order('created', { ascending: false })
        .limit(100);
    if (error) throw error;
    return data || [];
}

/**
 * Realtime subscription for a Supabase table.
 * Returns an unsubscribe function. Calls `onChange()` (no payload) on any
 * INSERT/UPDATE/DELETE so the caller can refetch — mirroring the PocketBase
 * subscribe pattern used elsewhere.
 */
export function subscribeSupabase(table, onChange) {
    const s = requireClient();
    const channel = s
        .channel(`rt-${table}-${Math.random().toString(36).slice(2, 8)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
            try {
                onChange();
            } catch (_) {
                /* best-effort */
            }
        })
        .subscribe();

    return () => {
        try {
            s.removeChannel(channel);
        } catch (_) {
            /* noop */
        }
    };
}
