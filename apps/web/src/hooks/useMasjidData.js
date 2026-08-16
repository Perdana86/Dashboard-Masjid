import { useCallback, useEffect, useState } from 'react';
import { fetchDashboardSlides, fetchJadwal, fetchSettings, fetchSlides, isAbortError, jakartaParts, subscribeCollection } from '@/lib/masjid';

const onlyActive = (list) => (list || []).filter((item) => item.active !== false);

export default function useMasjidData() {
    const [settings, setSettings] = useState(null);
    const [slides, setSlides] = useState([]);
    const [dashboardSlides, setDashboardSlides] = useState([]);
    const [prayer, setPrayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            // Each call gets a distinct requestKey so concurrent mounts (e.g.
            // PWA manifest hook + this hook) don't share the SDK default key
            // and auto-cancel each other.
            const [s, sl, dsl] = await Promise.all([
                fetchSettings({ requestKey: 'masjid-data-settings' }),
                fetchSlides(),
                fetchDashboardSlides(),
            ]);
            setSettings(s);
            setSlides(onlyActive(sl));
            setDashboardSlides(onlyActive(dsl));

            const cityId = (s && s.city_id) || '1301';
            try {
                setPrayer(await fetchJadwal(cityId, jakartaParts().isoDate));
            } catch (e) {
                setPrayer(null);
                if (!isAbortError(e)) setError(e.message);
            }
        } catch (e) {
            // Abort/auto-cancel is expected when a newer load supersedes this
            // one — never surface it as a user-facing error.
            if (!isAbortError(e)) setError(e.message || 'Gagal memuat data masjid');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // refresh schedule every 15 minutes (also handles date rollover)
    useEffect(() => {
        const id = setInterval(() => {
            load();
        }, 15 * 60 * 1000);
        return () => clearInterval(id);
    }, [load]);

    // Realtime sync: refresh slide lists whenever either collection changes.
    // Routes to Supabase postgres_changes or PocketBase realtime depending on
    // the active database source (see lib/dbSource.js + lib/masjid.js).
    useEffect(() => {
        let cancelled = false;

        const refetchSlides = () =>
            fetchSlides({ requestKey: 'masjid-data-slides-rt' })
                .then((list) => { if (!cancelled) setSlides(onlyActive(list)); })
                .catch(() => {});
        const refetchDash = () =>
            fetchDashboardSlides({ requestKey: 'masjid-data-dash-rt' })
                .then((list) => { if (!cancelled) setDashboardSlides(onlyActive(list)); })
                .catch(() => {});
        const refetchSettings = () =>
            fetchSettings({ requestKey: 'masjid-data-settings-rt' })
                .then((s) => { if (!cancelled) setSettings(s); })
                .catch(() => {});

        const unsubSlides = subscribeCollection('slides', refetchSlides);
        const unsubDash = subscribeCollection('dashboard_slides', refetchDash);
        const unsubSettings = subscribeCollection('settings', refetchSettings);

        return () => {
            cancelled = true;
            try { unsubSlides && unsubSlides(); } catch (_) {}
            try { unsubDash && unsubDash(); } catch (_) {}
            try { unsubSettings && unsubSettings(); } catch (_) {}
        };
    }, []);

    return { settings, slides, dashboardSlides, prayer, loading, error, reload: load };
}
