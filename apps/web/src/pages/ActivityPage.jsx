import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Maximize2, Minimize2, Play } from 'lucide-react';
import { fetchActivities, fetchSettings, fileUrl, youtubeEmbedUrl, youtubeVideoId, isAbortError, subscribeCollection } from '@/lib/masjid';
import useTheme from '@/hooks/useTheme';
import useFavicon from '@/hooks/useFavicon';

const ActivityPage = () => {
    const [activities, setActivities] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeVideo, setActiveVideo] = useState(null); // { id, kind: 'local'|'youtube' }

    useTheme(settings);
    useFavicon(settings);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const [a, s] = await Promise.all([
                    fetchActivities({ requestKey: 'activity-page-list' }),
                    fetchSettings({ requestKey: 'activity-page-settings' }),
                ]);
                if (!mounted) return;
                setActivities((a || []).filter((item) => item.active !== false));
                setSettings(s);
            } catch (e) {
                if (!isAbortError(e) && mounted) setError(e.message || 'Gagal memuat kegiatan masjid');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();

        // Realtime sync from admin edits (source-aware: Supabase or PocketBase).
        const unsubList = subscribeCollection('activities', () => {
            if (!mounted) return;
            fetchActivities({ requestKey: 'activity-page-list-rt' })
                .then((list) => { if (mounted) setActivities((list || []).filter((item) => item.active !== false)); })
                .catch(() => {});
        });
        const unsubSettings = subscribeCollection('settings', () => {
            if (!mounted) return;
            fetchSettings({ requestKey: 'activity-page-settings-rt' }).then((s) => { if (mounted) setSettings(s); }).catch(() => {});
        });

        return () => {
            mounted = false;
            try { unsubList && unsubList(); } catch (_) {}
            try { unsubSettings && unsubSettings(); } catch (_) {}
        };
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const mosqueName = (settings && settings.mosque_name) || 'Masjid Al-Amanah';

    const renderMedia = (item) => {
        const imageUrl = item.image ? fileUrl(item, item.image) : '';
        const localVideoUrl = item.video_local ? fileUrl(item, item.video_local) : '';
        const ytId = youtubeVideoId(item.video_youtube);

        // If a video is selected for this item, show it.
        if (activeVideo && activeVideo.id === item.id) {
            if (activeVideo.kind === 'local' && localVideoUrl) {
                return (
                    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
                        <video src={localVideoUrl} controls autoPlay className="h-full w-full object-contain" />
                        <button
                            type="button"
                            onClick={() => setActiveVideo(null)}
                            className="absolute right-2 top-2 inline-flex items-center gap-1 border border-white/20 bg-black/60 px-2.5 py-1.5 text-xs text-white transition-colors hover:border-[var(--m-primary)]"
                        >
                            Tutup
                        </button>
                    </div>
                );
            }
            if (activeVideo.kind === 'youtube' && ytId) {
                return (
                    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                            title={item.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <button
                            type="button"
                            onClick={() => setActiveVideo(null)}
                            className="absolute right-2 top-2 inline-flex items-center gap-1 border border-white/20 bg-black/60 px-2.5 py-1.5 text-xs text-white transition-colors hover:border-[var(--m-primary)]"
                        >
                            Tutup
                        </button>
                    </div>
                );
            }
        }

        // Default: show image with play buttons overlay if videos exist.
        return (
            <div className="relative w-full overflow-hidden bg-[var(--m-surface)]" style={{ aspectRatio: '16 / 9' }}>
                {imageUrl ? (
                    <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <CalendarDays className="h-12 w-12 text-[var(--m-primary)]/40" strokeWidth={1.5} />
                    </div>
                )}
                {(localVideoUrl || ytId) ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30">
                        {localVideoUrl ? (
                            <button
                                type="button"
                                onClick={() => setActiveVideo({ id: item.id, kind: 'local' })}
                                className="inline-flex items-center gap-2 border border-white/30 bg-black/50 px-4 py-2.5 text-sm text-white backdrop-blur transition-colors hover:border-[var(--m-primary)] hover:bg-black/70"
                            >
                                <Play className="h-4 w-4" strokeWidth={2} /> Putar Video
                            </button>
                        ) : null}
                        {ytId ? (
                            <button
                                type="button"
                                onClick={() => setActiveVideo({ id: item.id, kind: 'youtube' })}
                                className="inline-flex items-center gap-2 border border-white/30 bg-black/50 px-4 py-2.5 text-sm text-white backdrop-blur transition-colors hover:border-[var(--m-primary)] hover:bg-black/70"
                            >
                                <Play className="h-4 w-4" strokeWidth={2} /> Putar YouTube
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--m-bg)] text-emerald-50">
            <Helmet>
                <title>Kegiatan Masjid | Agenda & Informasi Kegiatan</title>
                <meta
                    name="description"
                    content="Daftar kegiatan masjid: judul, deskripsi, gambar, video lokal, dan video YouTube. Informasi agenda kegiatan jamaah diperbarui real-time."
                />
            </Helmet>

            <div className="masjid-pattern flex min-h-[100dvh] flex-col">
                <header className="border-b border-white/10 px-6 py-5 md:px-10">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--m-primary)]">Kegiatan Masjid</p>
                        <h1 className="font-display text-2xl leading-tight text-white md:text-3xl">{mosqueName}</h1>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:px-10 md:py-12">
                    {loading ? (
                        <div className="space-y-6">
                            {[0, 1].map((i) => (
                                <div key={i} className="space-y-3">
                                    <div className="h-56 w-full animate-pulse rounded bg-white/[0.05]" />
                                    <div className="h-7 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                                    <div className="h-20 w-full animate-pulse rounded bg-white/[0.05]" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                            {error}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="border border-white/10 bg-white/[0.03] p-8 text-center text-emerald-100/60">
                            Belum ada kegiatan yang ditampilkan. Silakan tambahkan kegiatan di Panel Admin &rarr; tab Kegiatan.
                        </div>
                    ) : (
                        <div className="space-y-8 md:space-y-10">
                            {activities.map((item, i) => (
                                <motion.article
                                    key={item.id}
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                                    className="overflow-hidden rounded border border-white/10 bg-[var(--m-surface)]/60"
                                >
                                    {renderMedia(item)}
                                    <div className="p-5 md:p-7">
                                        <h2 className="font-display text-2xl text-white md:text-3xl">{item.title}</h2>
                                        {item.description ? (
                                            <div className="mt-3 space-y-3 text-sm text-emerald-50/85 md:text-base">
                                                {item.description.split('\n').map((para, idx) => (
                                                    <p key={idx} className="leading-relaxed">{para}</p>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </main>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-3 text-xs text-emerald-100/45 md:px-10">
                    <span>&copy; {new Date().getFullYear()} {mosqueName}</span>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link to="/" className="inline-flex min-h-11 items-center gap-1 hover:text-[var(--m-primary)]">
                            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Kembali ke Dashboard
                        </Link>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-3 py-2 text-xs text-emerald-100/70 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)]"
                            title={isFullscreen ? 'Keluar dari fullscreen' : 'Masuk fullscreen'}
                        >
                            {isFullscreen ? (
                                <>
                                    <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Keluar Fullscreen
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Fullscreen
                                </>
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ActivityPage;
