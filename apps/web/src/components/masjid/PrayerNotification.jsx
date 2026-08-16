import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Volume2 } from 'lucide-react';

/**
 * Floating prayer / iqomah notification banner.
 * Shows one stacked card per active notification; each is dismissible.
 * Works on the dashboard and the fullscreen informasi overlay.
 */
const PrayerNotification = ({ active, onDismiss, variant = 'dashboard' }) => {
    // Auto-dismiss each notification after 90 seconds if the user doesn't.
    useEffect(() => {
        if (!active.length) return;
        const timers = active.map((n) =>
            setTimeout(() => onDismiss(n.id), 90 * 1000),
        );
        return () => timers.forEach(clearTimeout);
    }, [active, onDismiss]);

    const isInfo = variant === 'informasi';

    return (
        <div
            className={`pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 ${
                isInfo ? 'top-20' : 'top-4'
            } md:top-6`}
            aria-live="assertive"
        >
            <AnimatePresence>
                {active.map((n) => {
                    const isIqomah = n.type === 'iqomah';
                    const accent = isIqomah ? 'var(--m-iqomah)' : 'var(--m-primary)';
                    const title = isIqomah ? `Iqomah ${n.label}` : `Waktu Sholat ${n.label}`;
                    const subtitle = isIqomah
                        ? 'Iqomah telah tiba, silakan siapkan sholat berjamaah.'
                        : 'Adzan telah tiba, silakan tunaikan sholat.';

                    return (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: -24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -16, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border bg-[var(--m-surface)]/95 shadow-2xl backdrop-blur-md"
                            style={{ borderColor: `color-mix(in srgb, ${accent} 55%, transparent)` }}
                        >
                            <div className="flex items-stretch">
                                <div className="flex w-1.5 shrink-0" style={{ background: accent }} />
                                <div className="flex flex-1 items-start gap-3 p-4">
                                    <div
                                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                        style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
                                    >
                                        <Bell className="h-4 w-4" style={{ color: accent }} strokeWidth={2} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-display text-base leading-tight text-white md:text-lg">
                                                {title}
                                            </p>
                                            <span
                                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                style={{
                                                    color: accent,
                                                    background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                                                }}
                                            >
                                                {n.clock}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-emerald-100/70 md:text-sm">{subtitle}</p>
                                        <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-100/45">
                                            <Volume2 className="h-3 w-3" strokeWidth={1.75} />
                                            Nada notifikasi 10 detik
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onDismiss(n.id)}
                                        className="shrink-0 rounded-md p-1 text-emerald-100/60 transition-colors hover:bg-white/10 hover:text-white"
                                        title="Tutup notifikasi"
                                        aria-label="Tutup notifikasi"
                                    >
                                        <X className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default PrayerNotification;
