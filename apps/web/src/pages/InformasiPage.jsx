import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LiveClock, { useJakartaClock } from '@/components/masjid/LiveClock';
import Marquee from '@/components/masjid/Marquee';
import SlideShow from '@/components/masjid/SlideShow';
import useMasjidData from '@/hooks/useMasjidData';
import useTheme from '@/hooks/useTheme';
import useFavicon from '@/hooks/useFavicon';
import usePrayerNotifications from '@/hooks/usePrayerNotifications';
import PrayerNotification from '@/components/masjid/PrayerNotification';
import { slideImage, slideMediaType } from '@/lib/masjid';

/** Sample average luminance of the top band of an image (0–255). Returns null if unavailable. */
function sampleTopLuminance(src) {
    return new Promise((resolve) => {
        if (!src || /\.pdf(\?|$)/i.test(src)) {
            resolve(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const w = 64;
                const h = 24;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    resolve(null);
                    return;
                }
                // Draw top ~18% of the source image into the sample canvas
                const srcH = Math.max(1, Math.floor(img.naturalHeight * 0.18));
                ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, w, h);
                const data = ctx.getImageData(0, 0, w, h).data;
                let sum = 0;
                const n = w * h;
                for (let i = 0; i < data.length; i += 4) {
                    // Rec. 709 luminance
                    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                }
                resolve(sum / n);
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function parseHexLuma(hex) {
    if (!hex || typeof hex !== 'string') return null;
    const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const InformasiPage = () => {
    const now = useJakartaClock();
    const { settings, slides, prayer, loading } = useMasjidData();
    useTheme(settings);
    useFavicon(settings);
    const { active: notifActive, dismiss: dismissNotif } = usePrayerNotifications(
        prayer && prayer.jadwal,
        now,
        'informasi',
    );

    const [slideIndex, setSlideIndex] = useState(0);
    const [headerOnLight, setHeaderOnLight] = useState(false);

    const items = useMemo(() => slides || [], [slides]);
    const current = items.length ? items[Math.min(slideIndex, items.length - 1)] : null;

    useEffect(() => {
        let cancelled = false;

        async function updateContrast() {
            if (!current) {
                if (!cancelled) setHeaderOnLight(false);
                return;
            }

            if (current.slide_type === 'text') {
                const luma = parseHexLuma(current.text_bg || current.text_background_color);
                if (!cancelled) setHeaderOnLight(luma != null ? luma > 140 : false);
                return;
            }

            const src = slideImage(current);
            const type = slideMediaType(current);
            if (!src || type === 'pdf') {
                if (!cancelled) setHeaderOnLight(false);
                return;
            }

            const luma = await sampleTopLuminance(src);
            if (!cancelled) setHeaderOnLight(luma != null ? luma > 140 : false);
        }

        updateContrast();
        return () => {
            cancelled = true;
        };
    }, [current]);

    const onIndexChange = useCallback((i) => setSlideIndex(i), []);

    const textMain = headerOnLight ? 'text-emerald-950' : 'text-white';
    const textMuted = headerOnLight ? 'text-emerald-900/70' : 'text-emerald-100/70';
    const labelColor = headerOnLight ? 'text-emerald-800' : 'text-[var(--m-primary)]';
    const borderBtn = headerOnLight
        ? 'border-emerald-900/25 hover:border-emerald-900 hover:text-emerald-950'
        : 'border-white/15 hover:border-[var(--m-primary)] hover:text-[var(--m-primary)]';
    const scrim = headerOnLight
        ? 'bg-gradient-to-b from-white/55 via-white/20 to-transparent'
        : 'bg-gradient-to-b from-black/55 via-black/25 to-transparent';

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--m-bg)] text-emerald-50">
            <Helmet>
                <title>Layar Informasi Masjid | Slide Pengumuman Jamaah</title>
                <meta
                    name="description"
                    content="Layar penuh slide informasi penting masjid: kajian, kegiatan sosial, dan pengumuman jamaah dengan jam digital waktu Asia/Jakarta."
                />
            </Helmet>

            <PrayerNotification active={notifActive} onDismiss={dismissNotif} variant="informasi" />

            {/* Slide fills entire viewport */}
            <div className="absolute inset-0">
                {loading ? (
                    <div className="absolute inset-0 animate-pulse bg-white/[0.04]" />
                ) : (
                    <SlideShow
                        slides={slides}
                        seconds={(settings && settings.slide_seconds) || 8}
                        fillMode="contain"
                        showCaption
                        onIndexChange={onIndexChange}
                    />
                )}
            </div>

            {/* Header overlay — transparent, on top of slide */}
            <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
                <div className={`pointer-events-auto transition-colors duration-500 ${scrim}`}>
                    <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-8 md:py-5">
                        <div className="min-w-0">
                            <p
                                className={`text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-500 ${labelColor}`}
                            >
                                Layar Informasi
                            </p>
                            <h1
                                className={`truncate font-display text-xl transition-colors duration-500 md:text-2xl ${textMain}`}
                                style={{ textShadow: headerOnLight ? '0 1px 0 rgba(255,255,255,0.4)' : '0 1px 8px rgba(0,0,0,0.45)' }}
                            >
                                {(settings && settings.mosque_name) || 'Dashboard Masjid'}
                            </h1>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 md:gap-6">
                            <LiveClock
                                now={now}
                                className={`text-3xl font-semibold transition-colors duration-500 md:text-5xl ${textMain}`}
                                style={{ textShadow: headerOnLight ? '0 1px 0 rgba(255,255,255,0.35)' : '0 2px 12px rgba(0,0,0,0.5)' }}
                            />
                            <Link
                                to="/"
                                className={`inline-flex items-center gap-2 border px-3 py-2 text-xs transition-colors duration-500 ${textMuted} ${borderBtn}`}
                            >
                                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Marquee overlay — fixed at bottom, on top of slide */}
            <div className="absolute inset-x-0 bottom-0 z-30">
                <Marquee text={settings && settings.running_text} />
            </div>
        </div>
    );
};

export default InformasiPage;
