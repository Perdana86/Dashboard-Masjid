import { useCallback, useEffect, useRef, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { playBeeps, unlockAudio } from '@/lib/beep';
import { toMinutes } from '@/lib/masjid';

const IQOMAH_OFFSET = 10; // minutes after adzan, matches dashboard iqomah column

const FARDHU = [
    { key: 'subuh', label: 'Subuh' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isya', label: 'Isya' },
];

/**
 * Build the list of { key, label, type, minute, time } events for today.
 * Returns sholat (adzan) and iqomah events for the five fardhu prayers.
 */
function buildEvents(jadwal) {
    if (!jadwal) return [];
    const events = [];
    for (const p of FARDHU) {
        const m = toMinutes(jadwal[p.key]);
        if (m === null) continue;
        events.push({
            key: p.key,
            label: p.label,
            type: 'sholat',
            minute: m,
            time: jadwal[p.key],
        });
        events.push({
            key: p.key,
            label: p.label,
            type: 'iqomah',
            minute: (m + IQOMAH_OFFSET) % (24 * 60),
            time: iqomahTime(m + IQOMAH_OFFSET),
        });
    }
    return events;
}

function iqomahTime(totalMin) {
    const t = ((totalMin % (24 * 60)) + (24 * 60)) % (24 * 60);
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function fmtClock(minute) {
    const t = ((minute % (24 * 60)) + (24 * 60)) % (24 * 60);
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

let notifSeq = 0;

/**
 * Hook that watches the Jakarta clock and fires a text + sound notification
 * exactly once when each fardhu prayer time (adzan) and its iqomah time arrive.
 *
 * @param {object} jadwal  prayer.jadwal object from useMasjidData
 * @param {object} now     jakartaParts() clock value (updates every second)
 * @param {string} source  label identifying the page ("dashboard" | "informasi")
 */
export default function usePrayerNotifications(jadwal, now, source = 'dashboard') {
    const [active, setActive] = useState([]);
    const firedRef = useRef(new Set());
    const eventsRef = useRef([]);
    const lastMinuteRef = useRef(-1);

    // Refresh the event list whenever the schedule changes.
    useEffect(() => {
        eventsRef.current = buildEvents(jadwal);
    }, [jadwal]);

    const logNotification = useCallback(
        (event) => {
            try {
                pb.collection('notifications').create({
                    prayer_key: event.key,
                    prayer_label: event.label,
                    notification_type: event.type,
                    scheduled_time: event.time,
                    triggered_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    source,
                }, { requestKey: `notif-${event.key}-${event.type}-${now.isoDate}-${source}` });
            } catch (e) {
                // Logging is best-effort; never block the UI on it.
                // eslint-disable-next-line no-console
                console.warn('Failed to log notification', e);
            }
        },
        [now.isoDate, source],
    );

    const fire = useCallback(
        (event) => {
            const id = `n${++notifSeq}`;
            const notif = {
                id,
                key: event.key,
                label: event.label,
                type: event.type,
                time: event.time,
                clock: fmtClock(event.minute),
            };
            setActive((prev) => [...prev, notif]);
            void playBeeps({ seconds: 10, freq: 880, duration: 0.18, interval: 0.32, gain: 0.22 });
            logNotification(event);
        },
        [logNotification],
    );

    // Check every clock tick whether a new event minute has been reached.
    useEffect(() => {
        if (!now || !jadwal) return;
        const minute = now.minutesOfDay;
        if (minute === lastMinuteRef.current) return;
        lastMinuteRef.current = minute;

        const isoDate = now.isoDate;
        for (const event of eventsRef.current) {
            const fireKey = `${isoDate}-${event.key}-${event.type}`;
            if (event.minute === minute && !firedRef.current.has(fireKey)) {
                firedRef.current.add(fireKey);
                fire(event);
            }
        }
    }, [now, jadwal, fire]);

    // Prune fired keys from previous days so the Set doesn't grow unbounded
    // and so the same prayer can fire again the next day.
    useEffect(() => {
        if (!now) return;
        const today = now.isoDate;
        for (const key of Array.from(firedRef.current)) {
            if (!key.startsWith(today)) firedRef.current.delete(key);
        }
    }, [now]);

    const dismiss = useCallback((id) => {
        setActive((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const dismissAll = useCallback(() => setActive([]), []);

    // Unlock the AudioContext on the first user gesture so the clock-driven
    // beeps are allowed to play under browser autoplay policies (also needed
    // inside PWA webviews).
    useEffect(() => {
        const unlock = () => unlockAudio();
        const opts = { once: true, passive: true };
        window.addEventListener('pointerdown', unlock, opts);
        window.addEventListener('keydown', unlock, opts);
        window.addEventListener('touchstart', unlock, opts);
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
    }, []);

    return { active, dismiss, dismissAll };
}
