import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Mail, MapPin, Phone, Maximize2, Minimize2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { fetchBio, fetchBioLinks, fileUrl, isAbortError, subscribeCollection } from '@/lib/masjid';
import useTheme from '@/hooks/useTheme';
import useFavicon from '@/hooks/useFavicon';
import { fetchSettings } from '@/lib/masjid';

const BioPage = () => {
    const [bio, setBio] = useState(null);
    const [settings, setSettings] = useState(null);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    useTheme(settings);
    useFavicon(settings);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const [b, s, l] = await Promise.all([
                    fetchBio({ requestKey: 'bio-page-bio' }),
                    fetchSettings({ requestKey: 'bio-page-settings' }),
                    fetchBioLinks({ requestKey: 'bio-page-links' }),
                ]);
                if (!mounted) return;
                setBio(b);
                setSettings(s);
                setLinks((l || []).filter((item) => item.active !== false));
            } catch (e) {
                if (!isAbortError(e) && mounted) setError(e.message || 'Gagal memuat bio masjid');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();

        // Realtime sync from admin edits (source-aware: Supabase or PocketBase).
        const unsubBio = subscribeCollection('bio', () => {
            if (!mounted) return;
            fetchBio({ requestKey: 'bio-page-bio-rt' }).then((b) => { if (mounted) setBio(b); }).catch(() => {});
        });
        const unsubSettings = subscribeCollection('settings', () => {
            if (!mounted) return;
            fetchSettings({ requestKey: 'bio-page-settings-rt' }).then((s) => { if (mounted) setSettings(s); }).catch(() => {});
        });
        const unsubLinks = subscribeCollection('bio_links', () => {
            if (!mounted) return;
            fetchBioLinks({ requestKey: 'bio-page-links-rt' })
                .then((list) => { if (mounted) setLinks((list || []).filter((item) => item.active !== false)); })
                .catch(() => {});
        });

        return () => {
            mounted = false;
            try { unsubBio && unsubBio(); } catch (_) {}
            try { unsubSettings && unsubSettings(); } catch (_) {}
            try { unsubLinks && unsubLinks(); } catch (_) {}
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

    const photo = bio && bio.photo ? fileUrl(bio, bio.photo) : '';
    const mosqueName = (bio && bio.mosque_name) || (settings && settings.mosque_name) || 'Masjid Al-Amanah';

    const contactItems = [
        bio && bio.address ? { icon: MapPin, label: 'Alamat', value: bio.address } : null,
        bio && bio.phone ? { icon: Phone, label: 'Telepon', value: bio.phone } : null,
        bio && bio.email ? { icon: Mail, label: 'Email', value: bio.email } : null,
        bio && bio.operating_hours ? { icon: Clock, label: 'Jam Operasional', value: bio.operating_hours } : null,
    ].filter(Boolean);

    return (
        <div className="min-h-[100dvh] bg-[var(--m-bg)] text-emerald-50">
            <Helmet>
                <title>Tentang Masjid | Bio & Profil Masjid</title>
                <meta
                    name="description"
                    content="Profil dan informasi lengkap masjid: sejarah, deskripsi, alamat, kontak, dan jam operasional."
                />
            </Helmet>

            <div className="masjid-pattern flex min-h-[100dvh] flex-col">
                <header className="border-b border-white/10 px-6 py-5 md:px-10">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--m-primary)]">Tentang Masjid</p>
                        <h1 className="font-display text-2xl leading-tight text-white md:text-3xl">{mosqueName}</h1>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:px-10 md:py-12">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="h-72 w-full animate-pulse rounded bg-white/[0.05]" />
                            <div className="h-8 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                            <div className="h-24 w-full animate-pulse rounded bg-white/[0.05]" />
                        </div>
                    ) : error ? (
                        <div className="border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                            {error}
                        </div>
                    ) : !bio ? (
                        <div className="border border-white/10 bg-white/[0.03] p-8 text-center text-emerald-100/60">
                            Konten bio belum diisi. Silakan atur di Panel Admin &rarr; tab Bio.
                        </div>
                    ) : (
                        <div className="space-y-8 md:space-y-10">
                            {/* Hero photo + name */}
                            <motion.section
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="overflow-hidden rounded border border-white/10 bg-[var(--m-surface)]/60"
                            >
                                {photo ? (
                                    <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
                                        <img src={photo} alt={mosqueName} className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--m-bg)] via-[var(--m-bg)]/30 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                                            <h2 className="font-display text-3xl text-white md:text-5xl">{mosqueName}</h2>
                                            {bio.description ? (
                                                <p className="mt-2 max-w-2xl text-sm text-emerald-100/80 md:text-base">{bio.description}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 md:p-10">
                                        <h2 className="font-display text-3xl text-white md:text-5xl">{mosqueName}</h2>
                                        {bio.description ? (
                                            <p className="mt-3 max-w-2xl text-sm text-emerald-100/80 md:text-base">{bio.description}</p>
                                        ) : null}
                                    </div>
                                )}
                            </motion.section>

                            {/* Contact grid */}
                            {contactItems.length > 0 ? (
                                <section className="grid gap-4 sm:grid-cols-2">
                                    {contactItems.map((item, i) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, y: 14 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                                            className="flex items-start gap-4 border border-white/10 bg-white/[0.03] p-5"
                                        >
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--m-primary)_40%,transparent)] text-[var(--m-primary)]">
                                                <item.icon className="h-5 w-5" strokeWidth={1.75} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/55">{item.label}</p>
                                                <p className="mt-1 break-words text-sm text-emerald-50/90 md:text-base">{item.value}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </section>
                            ) : null}

                            {/* Long description */}
                            {bio.long_description ? (
                                <motion.section
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
                                    className="border-l-2 border-[var(--m-primary)] bg-white/[0.02] p-6 md:p-8"
                                >
                                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--m-primary)]">Tentang Kami</p>
                                    <div className="mt-4 space-y-4 text-emerald-50/85 md:text-lg">
                                        {bio.long_description.split('\n').map((para, idx) => (
                                            <p key={idx} className="leading-relaxed">{para}</p>
                                        ))}
                                    </div>
                                </motion.section>
                            ) : null}

                            {/* Link buttons */}
                            {links.length > 0 ? (
                                <motion.section
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
                                >
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {links.map((link, i) => {
                                            const icon = link.icon ? fileUrl(link, link.icon) : '';
                                            return (
                                                <motion.a
                                                    key={link.id}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.05 * i, ease: 'easeOut' }}
                                                    className="group flex items-center gap-4 border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[var(--m-primary)] hover:bg-[color-mix(in_srgb,var(--m-primary)_8%,transparent)]"
                                                >
                                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-[color-mix(in_srgb,var(--m-primary)_40%,transparent)] bg-[var(--m-surface)]/60">
                                                        {icon ? (
                                                            <img src={icon} alt="" className="h-full w-full object-contain p-1.5" />
                                                        ) : (
                                                            <LinkIcon className="h-5 w-5 text-[var(--m-primary)]" strokeWidth={1.75} />
                                                        )}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium text-emerald-50/90 md:text-base">{link.label}</span>
                                                    </span>
                                                    <ExternalLink className="h-4 w-4 shrink-0 text-emerald-100/40 transition-colors group-hover:text-[var(--m-primary)]" strokeWidth={1.75} />
                                                </motion.a>
                                            );
                                        })}
                                    </div>
                                </motion.section>
                            ) : null}
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

export default BioPage;
