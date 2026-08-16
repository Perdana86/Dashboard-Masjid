import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Check, Loader2, LogOut, Monitor, Save, Trash2, Upload } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { fetchKota, fetchSettings, fetchBio, fileUrl, formatIdr, isAbortError, THEME_DEFAULTS } from '@/lib/masjid';
import useTheme from '@/hooks/useTheme';
import useFavicon from '@/hooks/useFavicon';
import SlideManager from '@/components/masjid/SlideManager';
import BioLinkManager from '@/components/masjid/BioLinkManager';
import ActivityManager from '@/components/masjid/ActivityManager';
import DatabaseTab from '@/components/admin/DatabaseTab';

const inputClass =
    'w-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-white outline-none transition-colors placeholder:text-emerald-100/30 focus:border-[var(--m-primary)]';
const labelClass = 'text-xs uppercase tracking-[0.2em] text-emerald-100/60';

const PRESETS = [
    { name: 'Emerald Gold', bg: '#04100c', surface: '#0d2019', primary: '#c9a227', text: '#ecfdf5' },
    { name: 'Midnight Blue', bg: '#0a1024', surface: '#141d3a', primary: '#d4af37', text: '#e8eefc' },
    { name: 'Deep Maroon', bg: '#1a0a0f', surface: '#2a1118', primary: '#e0b15e', text: '#fdeeee' },
    { name: 'Slate Teal', bg: '#081517', surface: '#0f2326', primary: '#5ec9b1', text: '#eafff9' },
    { name: 'Royal Purple', bg: '#120a1f', surface: '#1d1233', primary: '#c9a86a', text: '#f3eefc' },
    { name: 'Warm Sand', bg: '#1c150a', surface: '#2a2012', primary: '#e9c46a', text: '#fdf6e3' },
];

const THEME_FIELDS = [
    { key: 'theme_bg', label: 'Warna Latar' },
    { key: 'theme_surface', label: 'Warna Panel' },
    { key: 'theme_primary', label: 'Warna Aksen' },
    { key: 'theme_text', label: 'Warna Teks' },
    { key: 'theme_iqomah', label: 'Warna Iqomah' },
];

const AdminPage = () => {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('umum');
    const [settings, setSettings] = useState(null);
    const [form, setForm] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [faviconBusy, setFaviconBusy] = useState(false);
    const [pwaLogoFile, setPwaLogoFile] = useState(null);
    const [pwaLogoBusy, setPwaLogoBusy] = useState(false);
    const [cities, setCities] = useState([]);
    const [citySearch, setCitySearch] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [infoCount, setInfoCount] = useState(0);
    const [dashCount, setDashCount] = useState(0);
    const [bioRecord, setBioRecord] = useState(null);
    const [bioForm, setBioForm] = useState(null);
    const [bioPhotoFile, setBioPhotoFile] = useState(null);
    const [bioBusy, setBioBusy] = useState(false);
    const [bioSaving, setBioSaving] = useState(false);

    useTheme(form);
    useFavicon(form);

    const load = async () => {
        setError('');
        try {
            const s = await fetchSettings({ requestKey: 'admin-settings', forcePocketBase: true });
            setSettings(s);
            setForm(
                s
                    ? { ...s }
                    : {
                        mosque_name: '',
                        tagline: '',
                        address: '',
                        running_text: '',
                        quote: '',
                        quote_source: '',
                        city_id: '1301',
                        city_name: 'KOTA JAKARTA',
                        slide_seconds: 8,
                        theme_bg: THEME_DEFAULTS.theme_bg,
                        theme_surface: THEME_DEFAULTS.theme_surface,
                        theme_primary: THEME_DEFAULTS.theme_primary,
                        theme_text: THEME_DEFAULTS.theme_text,
                        theme_iqomah: THEME_DEFAULTS.theme_iqomah,
                        saldo_pemasukan: 0,
                        saldo_pengeluaran: 0,
                        saldo_sisa: 0,
                        saldo_kas: 0,
                        saldo_visible: true,
                        saldo_label: 'Saldo Perpekan Jumat',
                        label_penerimaan: 'Penerimaan',
                        label_pengeluaran: 'Pengeluaran',
                        label_sisa: 'Sisa Saldo',
                        label_kas: 'Saldo Kas',
                        pwa_app_name: 'Dashboard Masjid Al-Amanah',
                        pwa_short_name: 'Masjid',
                        pwa_description: 'Dashboard masjid dengan jadwal sholat, iqomah, saldo jumat, dan slideshow informasi jamaah.',
                        pwa_theme_color: THEME_DEFAULTS.theme_bg,
                        pwa_bg_color: THEME_DEFAULTS.theme_bg,
                    },
            );
        } catch (e) {
            // Abort/auto-cancel is expected when another component's settings
            // fetch supersedes this one — never show it as a user error.
            if (!isAbortError(e)) setError(e.message || 'Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        loadBio();
        fetchKota()
            .then((res) => setCities(res.items || []))
            .catch(() => setCities([]));
    }, []);

    const filteredCities = useMemo(() => {
        const q = citySearch.trim().toLowerCase();
        const list = q ? cities.filter((c) => c.lokasi.toLowerCase().includes(q)) : cities;
        return list.slice(0, 60);
    }, [cities, citySearch]);

    const flash = (msg) => {
        setStatus(msg);
        setTimeout(() => setStatus(''), 2500);
    };

    const loadBio = async () => {
        try {
            const b = await fetchBio({ requestKey: 'admin-bio', forcePocketBase: true });
            setBioRecord(b);
            setBioForm(
                b
                    ? { ...b }
                    : {
                        mosque_name: '',
                        description: '',
                        address: '',
                        phone: '',
                        email: '',
                        operating_hours: '',
                        long_description: '',
                    },
            );
        } catch (e) {
            if (!isAbortError(e)) setError(e.message || 'Gagal memuat bio');
        }
    };

    const saveBio = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!bioForm) return;
        setBioSaving(true);
        setError('');
        try {
            const fd = new FormData();
            ['mosque_name', 'description', 'address', 'phone', 'email', 'operating_hours', 'long_description'].forEach((k) =>
                fd.append(k, bioForm[k] || ''),
            );
            if (bioPhotoFile) fd.append('photo', bioPhotoFile);

            const saved = bioRecord
                ? await pb.collection('bio').update(bioRecord.id, fd)
                : await pb.collection('bio').create(fd);

            setBioRecord(saved);
            setBioForm({ ...saved });
            setBioPhotoFile(null);
            flash('Bio masjid tersimpan.');
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menyimpan bio');
        } finally {
            setBioSaving(false);
        }
    };

    const deleteBioPhoto = async () => {
        if (!bioRecord) return;
        setBioBusy(true);
        setError('');
        try {
            const saved = await pb.collection('bio').update(bioRecord.id, { photo: null });
            setBioRecord(saved);
            setBioForm({ ...saved });
            setBioPhotoFile(null);
            flash('Foto bio dihapus.');
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus foto');
        } finally {
            setBioBusy(false);
        }
    };

    const saveSettings = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const fd = new FormData();
            ['mosque_name', 'tagline', 'address', 'running_text', 'quote', 'quote_source', 'city_id', 'city_name'].forEach((k) =>
                fd.append(k, form[k] || ''),
            );
            fd.append('slide_seconds', String(Number(form.slide_seconds) || 8));
            ['theme_bg', 'theme_surface', 'theme_primary', 'theme_text', 'theme_iqomah'].forEach((k) =>
                fd.append(k, form[k] || ''),
            );
            fd.append('sched_before_prayer', String(Number(form.sched_before_prayer) || 5));
            fd.append('sched_after_prayer', String(Number(form.sched_after_prayer) || 10));
            fd.append('sched_interval_hours', String(Number(form.sched_interval_hours) || 1));
            fd.append('sched_enabled', form.sched_enabled === false ? 'false' : 'true');
            const numOrZero = (v) => {
                const n = Number(v);
                return String(Number.isFinite(n) ? n : 0);
            };
            fd.append('saldo_pemasukan', numOrZero(form.saldo_pemasukan));
            fd.append('saldo_pengeluaran', numOrZero(form.saldo_pengeluaran));
            fd.append('saldo_sisa', numOrZero(form.saldo_sisa));
            fd.append('saldo_kas', numOrZero(form.saldo_kas));
            fd.append('saldo_visible', form.saldo_visible === false ? 'false' : 'true');
            fd.append('saldo_label', form.saldo_label || 'Saldo Perpekan Jumat');
            fd.append('label_penerimaan', form.label_penerimaan || 'Penerimaan');
            fd.append('label_pengeluaran', form.label_pengeluaran || 'Pengeluaran');
            fd.append('label_sisa', form.label_sisa || 'Sisa Saldo');
            fd.append('label_kas', form.label_kas || 'Saldo Kas');
            fd.append('pwa_app_name', form.pwa_app_name || '');
            fd.append('pwa_short_name', form.pwa_short_name || '');
            fd.append('pwa_description', form.pwa_description || '');
            fd.append('pwa_theme_color', form.pwa_theme_color || '');
            fd.append('pwa_bg_color', form.pwa_bg_color || '');
            if (logoFile) fd.append('logo', logoFile);
            if (faviconFile) fd.append('favicon', faviconFile);
            if (pwaLogoFile) fd.append('pwa_logo', pwaLogoFile);

            const saved = settings
                ? await pb.collection('settings').update(settings.id, fd)
                : await pb.collection('settings').create(fd);

            setSettings(saved);
            setForm({ ...saved });
            setLogoFile(null);
            setFaviconFile(null);
            setPwaLogoFile(null);
            flash('Pengaturan tersimpan.');
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const deleteFavicon = async () => {
        if (!settings) return;
        setFaviconBusy(true);
        setError('');
        try {
            const saved = await pb.collection('settings').update(settings.id, { favicon: null });
            setSettings(saved);
            setForm({ ...saved });
            setFaviconFile(null);
            flash('Favicon dihapus.');
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus favicon');
        } finally {
            setFaviconBusy(false);
        }
    };

    const deletePwaLogo = async () => {
        if (!settings) return;
        setPwaLogoBusy(true);
        setError('');
        try {
            const saved = await pb.collection('settings').update(settings.id, { pwa_logo: null });
            setSettings(saved);
            setForm({ ...saved });
            setPwaLogoFile(null);
            flash('Logo PWA dihapus.');
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus logo PWA');
        } finally {
            setPwaLogoBusy(false);
        }
    };

    const tabs = [
        { id: 'umum', label: 'Konten Dashboard' },
        { id: 'bio', label: 'Bio' },
        { id: 'kegiatan', label: 'Kegiatan' },
        { id: 'saldo', label: 'Saldo Jumat' },
        { id: 'slide_dashboard', label: `Slide Dashboard (${dashCount})` },
        { id: 'slide_info', label: `Slide Informasi (${infoCount})` },
        { id: 'jadwal_slide', label: 'Jadwal Slide' },
        { id: 'tema', label: 'Tema Warna' },
        { id: 'pwa', label: 'PWA' },
        { id: 'database', label: 'Database' },
    ];

    const parseSaldo = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };
    const saldoPemasukan = parseSaldo(form?.saldo_pemasukan);
    const saldoPengeluaran = parseSaldo(form?.saldo_pengeluaran);
    const sisaSaldo = parseSaldo(form?.saldo_sisa);
    const saldoKas = parseSaldo(form?.saldo_kas);

    return (
        <div className="min-h-[100dvh] bg-[var(--m-bg)] text-emerald-50">
            <Helmet>
                <title>Panel Admin | Dashboard Masjid</title>
                <meta name="description" content="Panel admin masjid untuk mengedit nama masjid, logo, running teks, kutipan, kota jadwal sholat, slide dashboard, slide informasi (gambar & PDF), dan warna tema dashboard." />
            </Helmet>

            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 md:px-10">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--m-primary)]">Panel Admin</p>
                    <h1 className="font-display text-2xl text-white">Pengelola Dashboard Masjid</h1>
                    <p className="text-sm text-emerald-100/50">Masuk sebagai {user ? user.email : '-'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        title="Lihat Dashboard"
                        className="inline-flex items-center justify-center border border-white/15 p-2 text-emerald-100/70 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)]"
                    >
                        <Monitor className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                    <button
                        type="button"
                        onClick={logout}
                        title="Keluar"
                        className="inline-flex items-center justify-center border border-white/15 p-2 text-emerald-100/70 transition-colors hover:border-red-400/60 hover:text-red-300"
                    >
                        <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                </div>
            </header>

            <div className="border-b border-white/10 px-6 md:px-10">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`-mb-px border-b-2 px-4 py-3 text-sm transition-colors ${
                            tab === t.id ? 'border-[var(--m-primary)] text-[var(--m-primary)]' : 'border-transparent text-emerald-100/55 hover:text-white'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <main className="px-6 py-8 md:px-10">
                {status ? (
                    <p className="mb-5 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                        <Check className="h-4 w-4" strokeWidth={2} /> {status}
                    </p>
                ) : null}
                {error ? (
                    <p className="mb-5 border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-200">{error}</p>
                ) : null}

                {loading || !form ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-12 animate-pulse rounded bg-white/[0.05]" />
                        ))}
                    </div>
                ) : tab === 'umum' ? (
                    <form onSubmit={saveSettings} className="flex max-w-6xl flex-col gap-5 pb-4">
                        {/* Identitas Masjid */}
                        <section className="grid gap-4 lg:grid-cols-3">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)] lg:col-span-3">Identitas Masjid</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="mosque_name">Nama Masjid</label>
                                <input id="mosque_name" className={inputClass} value={form.mosque_name || ''} onChange={(e) => setForm({ ...form, mosque_name: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="tagline">Tagline</label>
                                <input id="tagline" className={inputClass} value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="slide_seconds">Durasi Slide (detik)</label>
                                <input id="slide_seconds" type="number" min="3" max="120" className={inputClass} value={form.slide_seconds || 8} onChange={(e) => setForm({ ...form, slide_seconds: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1.5 lg:col-span-3">
                                <label className={labelClass} htmlFor="address">Alamat</label>
                                <input id="address" className={inputClass} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </section>

                        {/* Media & Ikon */}
                        <section className="grid gap-4 lg:grid-cols-2">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)] lg:col-span-2">Media &amp; Ikon</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="logo">Logo Masjid</label>
                                <input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0] || null)} className={inputClass} />
                                {settings && settings.logo ? (
                                    <img src={fileUrl(settings, settings.logo)} alt="Logo saat ini" className="mt-1.5 h-12 w-12 rounded-full object-cover ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" />
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="favicon">Favicon (ikon tab browser)</label>
                                <input
                                    id="favicon"
                                    type="file"
                                    accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
                                    onChange={(e) => setFaviconFile(e.target.files[0] || null)}
                                    className={inputClass}
                                />
                                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                    {faviconFile ? (
                                        <div className="flex items-center gap-2">
                                            <img src={URL.createObjectURL(faviconFile)} alt="Pratinjau favicon" className="h-9 w-9 rounded object-contain bg-white/5 ring-1 ring-white/10" />
                                            <span className="text-xs text-emerald-100/55">{faviconFile.name} (belum disimpan)</span>
                                        </div>
                                    ) : settings && settings.favicon ? (
                                        <div className="flex items-center gap-2">
                                            <img src={fileUrl(settings, settings.favicon)} alt="Favicon saat ini" className="h-9 w-9 rounded object-contain bg-white/5 ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" />
                                            <span className="text-xs text-emerald-100/55">Favicon saat ini</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-emerald-100/45">Belum ada favicon. PNG/JPG/SVG/ICO, maks. 5 MB.</span>
                                    )}
                                    {settings && settings.favicon && !faviconFile ? (
                                        <button
                                            type="button"
                                            onClick={deleteFavicon}
                                            disabled={faviconBusy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                        >
                                            {faviconBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />} Hapus
                                        </button>
                                    ) : null}
                                    {faviconFile ? (
                                        <button
                                            type="button"
                                            onClick={saveSettings}
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 border border-[color-mix(in_srgb,var(--m-primary)_60%,transparent)] px-2.5 py-1.5 text-xs text-[var(--m-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--m-primary)_10%,transparent)] disabled:opacity-60"
                                        >
                                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />} Unggah
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {/* Teks Berjalan & Kutipan */}
                        <section className="grid gap-4 lg:grid-cols-2">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)] lg:col-span-2">Teks Berjalan &amp; Kutipan</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="running_text">Running Teks (pisahkan tiap pesan dengan |)</label>
                                <textarea id="running_text" rows={2} className={inputClass} value={form.running_text || ''} onChange={(e) => setForm({ ...form, running_text: e.target.value })} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass} htmlFor="quote">Kutipan / Ayat</label>
                                    <textarea id="quote" rows={2} className={inputClass} value={form.quote || ''} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass} htmlFor="quote_source">Sumber Kutipan</label>
                                    <input id="quote_source" className={inputClass} value={form.quote_source || ''} onChange={(e) => setForm({ ...form, quote_source: e.target.value })} />
                                </div>
                            </div>
                        </section>

                        {/* Jadwal Sholat */}
                        <section className="grid gap-4 lg:grid-cols-2">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)] lg:col-span-2">Kota Jadwal Sholat (API myquran)</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="city_search">Cari Kota</label>
                                <input
                                    id="city_search"
                                    className={inputClass}
                                    placeholder="Mis. JAKARTA"
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="city_id">Pilih Kota</label>
                                <select
                                    id="city_id"
                                    className={inputClass}
                                    value={form.city_id || ''}
                                    onChange={(e) => {
                                        const city = cities.find((c) => c.id === e.target.value);
                                        setForm({ ...form, city_id: e.target.value, city_name: city ? city.lokasi : form.city_name });
                                    }}
                                >
                                    <option value={form.city_id || ''}>{form.city_name || 'Pilih kota'}</option>
                                    {filteredCities.map((c) => (
                                        <option key={c.id} value={c.id}>{c.lokasi}</option>
                                    ))}
                                </select>
                                {cities.length === 0 ? (
                                    <p className="text-xs text-emerald-100/45">Daftar kota belum termuat, ID kota saat ini tetap dipakai.</p>
                                ) : null}
                            </div>
                        </section>

                        {/* Sticky save bar — always visible without scrolling */}
                        <div className="sticky bottom-0 -mx-6 mt-1 border-t border-white/10 bg-[color-mix(in_srgb,var(--m-bg)_92%,transparent)] px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <span className="mr-auto text-xs text-emerald-100/50">Perubahan diterapkan real-time ke dashboard setelah disimpan.</span>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-2.5 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </div>
                    </form>
                ) : tab === 'bio' ? (
                    <div className="max-w-5xl">
                    <form onSubmit={saveBio} className="flex flex-col gap-6 pb-4">
                        <div>
                            <h2 className="font-display text-xl text-white">Bio Masjid</h2>
                            <p className="mt-1 text-sm text-emerald-100/55">
                                Konten profil masjid yang tampil di halaman /bio. Perubahan tersimpan ke database dan sinkron real-time ke halaman bio.
                            </p>
                        </div>

                        <section className="grid gap-4 lg:grid-cols-2">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)] lg:col-span-2">Identitas</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="bio_mosque_name">Nama Masjid</label>
                                <input id="bio_mosque_name" className={inputClass} value={bioForm?.mosque_name || ''} onChange={(e) => setBioForm({ ...bioForm, mosque_name: e.target.value })} placeholder="Masjid Al-Amanah" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="bio_email">Email</label>
                                <input id="bio_email" type="email" className={inputClass} value={bioForm?.email || ''} onChange={(e) => setBioForm({ ...bioForm, email: e.target.value })} placeholder="info@masjid-alamanah.site" />
                            </div>
                            <div className="flex flex-col gap-1.5 lg:col-span-2">
                                <label className={labelClass} htmlFor="bio_description">Deskripsi Singkat</label>
                                <textarea id="bio_description" rows={2} className={inputClass} value={bioForm?.description || ''} onChange={(e) => setBioForm({ ...bioForm, description: e.target.value })} placeholder="Ringkasan satu kalimat tentang masjid." />
                            </div>
                        </section>

                        <section className="grid gap-4 lg:grid-cols-2">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)] lg:col-span-2">Kontak &amp; Operasional</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="bio_address">Alamat Lengkap</label>
                                <textarea id="bio_address" rows={2} className={inputClass} value={bioForm?.address || ''} onChange={(e) => setBioForm({ ...bioForm, address: e.target.value })} placeholder="Jl. ... No. ..., Kota, Provinsi" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass} htmlFor="bio_phone">Nomor Telepon</label>
                                    <input id="bio_phone" className={inputClass} value={bioForm?.phone || ''} onChange={(e) => setBioForm({ ...bioForm, phone: e.target.value })} placeholder="+62 21 1234 5678" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass} htmlFor="bio_operating_hours">Jam Operasional</label>
                                    <input id="bio_operating_hours" className={inputClass} value={bioForm?.operating_hours || ''} onChange={(e) => setBioForm({ ...bioForm, operating_hours: e.target.value })} placeholder="Setiap hari, 04:00 - 21:00" />
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)]">Foto Masjid</h3>
                            <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-5">
                                <label className={labelClass} htmlFor="bio_photo">Unggah Foto (PNG/JPG/WebP/SVG/GIF/AVIF, maks. 10 MB)</label>
                                <input id="bio_photo" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif" onChange={(e) => setBioPhotoFile(e.target.files[0] || null)} className={inputClass} />
                                <div className="mt-1 flex flex-wrap items-center gap-4">
                                    {bioPhotoFile ? (
                                        <div className="flex items-center gap-3">
                                            <img src={URL.createObjectURL(bioPhotoFile)} alt="Pratinjau foto" className="h-24 w-40 rounded object-cover ring-1 ring-white/10" />
                                            <span className="text-xs text-emerald-100/55">{bioPhotoFile.name} (belum disimpan)</span>
                                        </div>
                                    ) : bioRecord && bioRecord.photo ? (
                                        <div className="flex items-center gap-3">
                                            <img src={fileUrl(bioRecord, bioRecord.photo)} alt="Foto saat ini" className="h-24 w-40 rounded object-cover ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" />
                                            <span className="text-xs text-emerald-100/55">Foto saat ini</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-emerald-100/45">Belum ada foto.</span>
                                    )}
                                    {bioRecord && bioRecord.photo && !bioPhotoFile ? (
                                        <button
                                            type="button"
                                            onClick={deleteBioPhoto}
                                            disabled={bioBusy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                        >
                                            {bioBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />} Hapus Foto
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)]">Deskripsi Panjang</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="bio_long_description">Teks Tambahan / Tentang Masjid</label>
                                <textarea id="bio_long_description" rows={8} className={inputClass} value={bioForm?.long_description || ''} onChange={(e) => setBioForm({ ...bioForm, long_description: e.target.value })} placeholder="Sejarah, visi, program, dan informasi lengkap tentang masjid. Pisahkan paragraf dengan baris baru." />
                                <p className="text-xs text-emerald-100/45">Paragraf dipisahkan dengan baris baru (Enter).</p>
                            </div>
                        </section>

                        <div className="sticky bottom-0 -mx-6 mt-1 border-t border-white/10 bg-[color-mix(in_srgb,var(--m-bg)_92%,transparent)] px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <span className="mr-auto text-xs text-emerald-100/50">Perubahan diterapkan real-time ke halaman /bio setelah disimpan.</span>
                                <button
                                    type="submit"
                                    disabled={bioSaving}
                                    className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-2.5 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                                >
                                    {bioSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                                    Simpan Bio
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-8">
                        <BioLinkManager />
                    </div>
                    </div>
                ) : tab === 'kegiatan' ? (
                    <ActivityManager />
                ) : tab === 'saldo' ? (
                    <div className="max-w-5xl space-y-6">
                        <div>
                            <h2 className="font-display text-xl text-white">Saldo Perpekan Jumat</h2>
                            <p className="mt-1 text-sm text-emerald-100/55">
                                Atur judul, nama label, dan nilai tiap kolom. Nilai boleh negatif (contoh: -13.937.817). Data tersimpan ke database dan tampil real-time di dashboard.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 max-w-xl">
                            <label className={labelClass} htmlFor="saldo_label">Judul Informasi</label>
                            <input
                                id="saldo_label"
                                className={inputClass}
                                value={form.saldo_label || ''}
                                onChange={(e) => setForm({ ...form, saldo_label: e.target.value })}
                                placeholder="Saldo Perpekan Jumat"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                {
                                    labelKey: 'label_penerimaan',
                                    labelId: 'label_penerimaan',
                                    labelTitle: 'Nama Label Penerimaan',
                                    labelPlaceholder: 'Penerimaan',
                                    valueKey: 'saldo_pemasukan',
                                    valueId: 'saldo_pemasukan',
                                    preview: saldoPemasukan,
                                    defaultLabel: 'Penerimaan',
                                },
                                {
                                    labelKey: 'label_pengeluaran',
                                    labelId: 'label_pengeluaran',
                                    labelTitle: 'Nama Label Pengeluaran',
                                    labelPlaceholder: 'Pengeluaran',
                                    valueKey: 'saldo_pengeluaran',
                                    valueId: 'saldo_pengeluaran',
                                    preview: saldoPengeluaran,
                                    defaultLabel: 'Pengeluaran',
                                },
                                {
                                    labelKey: 'label_sisa',
                                    labelId: 'label_sisa',
                                    labelTitle: 'Nama Label Sisa Saldo',
                                    labelPlaceholder: 'Sisa Saldo',
                                    valueKey: 'saldo_sisa',
                                    valueId: 'saldo_sisa',
                                    preview: sisaSaldo,
                                    defaultLabel: 'Sisa Saldo',
                                },
                                {
                                    labelKey: 'label_kas',
                                    labelId: 'label_kas',
                                    labelTitle: 'Nama Label Saldo Kas',
                                    labelPlaceholder: 'Saldo Kas',
                                    valueKey: 'saldo_kas',
                                    valueId: 'saldo_kas',
                                    preview: saldoKas,
                                    defaultLabel: 'Saldo Kas',
                                },
                            ].map((col) => (
                                <div
                                    key={col.valueKey}
                                    className="flex flex-col gap-4 border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                                >
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass} htmlFor={col.labelId}>{col.labelTitle}</label>
                                        <input
                                            id={col.labelId}
                                            className={inputClass}
                                            value={form[col.labelKey] || ''}
                                            onChange={(e) => setForm({ ...form, [col.labelKey]: e.target.value })}
                                            placeholder={col.labelPlaceholder}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                                        <label className={labelClass} htmlFor={col.valueId}>
                                            {(form[col.labelKey] || col.defaultLabel)} (Rp)
                                        </label>
                                        <input
                                            id={col.valueId}
                                            type="number"
                                            step="1"
                                            className={inputClass}
                                            value={form[col.valueKey] ?? 0}
                                            onChange={(e) => setForm({ ...form, [col.valueKey]: e.target.value })}
                                        />
                                        <p className={`text-xs font-num ${col.preview < 0 ? 'text-red-300/80' : 'text-emerald-100/45'}`}>
                                            Tampil: {formatIdr(col.preview)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, saldo_visible: form.saldo_visible === false })}
                                className={`inline-flex items-center gap-2 border px-4 py-2.5 text-sm transition-colors ${
                                    form.saldo_visible === false
                                        ? 'border-amber-400/40 text-amber-200 hover:border-amber-300'
                                        : 'border-emerald-400/40 text-emerald-200 hover:border-emerald-300'
                                }`}
                            >
                                {form.saldo_visible === false ? 'Tampilkan di Dashboard' : 'Sembunyikan dari Dashboard'}
                            </button>
                            <span className="text-sm text-emerald-100/50">
                                Status: {form.saldo_visible === false ? 'Disembunyikan' : 'Ditampilkan'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={saveSettings}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-3 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                            Simpan Saldo
                        </button>
                    </div>
                ) : tab === 'slide_dashboard' ? (
                    <SlideManager
                        collection="dashboard_slides"
                        heading="Slide Dashboard"
                        description="Slide/gambar yang tampil di halaman dashboard utama (/). Terpisah dari slide Layar Informasi."
                        onCountChange={setDashCount}
                    />
                ) : tab === 'slide_info' ? (
                    <SlideManager
                        collection="slides"
                        heading="Slide Layar Informasi"
                        description="Slide/gambar yang tampil di halaman Layar Informasi (/informasi). Terpisah dari slide dashboard."
                        onCountChange={setInfoCount}
                    />
                ) : tab === 'jadwal_slide' ? (
                    <div className="max-w-3xl space-y-6">
                        <div>
                            <h2 className="font-display text-xl text-white">Penjadwalan Otomatis Slide</h2>
                            <p className="mt-1 text-sm text-emerald-100/55">
                                Atur kapan Dashboard menampilkan Slide Dashboard atau Slide Layar Informasi.
                            </p>
                        </div>

                        <label className="flex items-center gap-3 text-sm text-emerald-100/80">
                            <input
                                type="checkbox"
                                checked={form.sched_enabled !== false}
                                onChange={(e) => setForm({ ...form, sched_enabled: e.target.checked })}
                            />
                            Aktifkan penjadwalan otomatis
                        </label>

                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="flex flex-col gap-2">
                                <label className={labelClass} htmlFor="sched_before_prayer">Menit sebelum sholat (Slide Dashboard)</label>
                                <input id="sched_before_prayer" type="number" min="1" max="60" className={inputClass}
                                    value={form.sched_before_prayer ?? 5}
                                    onChange={(e) => setForm({ ...form, sched_before_prayer: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={labelClass} htmlFor="sched_after_prayer">Menit setelah sholat (Slide Informasi)</label>
                                <input id="sched_after_prayer" type="number" min="1" max="60" className={inputClass}
                                    value={form.sched_after_prayer ?? 10}
                                    onChange={(e) => setForm({ ...form, sched_after_prayer: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={labelClass} htmlFor="sched_interval_hours">Interval rotasi (jam)</label>
                                <input id="sched_interval_hours" type="number" min="1" max="24" className={inputClass}
                                    value={form.sched_interval_hours ?? 1}
                                    onChange={(e) => setForm({ ...form, sched_interval_hours: e.target.value })} />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={saveSettings}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-3 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                            Simpan Jadwal
                        </button>
                    </div>
                ) : tab === 'tema' ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="font-display text-xl text-white">Editor Warna Tema</h2>
                            <p className="mt-1 text-sm text-emerald-100/55">
                                Pilih warna latar, panel, aksen, dan teks. Perubahan diterapkan langsung di seluruh dashboard saat disimpan.
                            </p>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] xl:items-start">
                            {/* Left: color form + presets */}
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {THEME_FIELDS.map((c) => (
                                        <div key={c.key} className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-5">
                                            <label className={labelClass} htmlFor={c.key}>{c.label}</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    id={c.key}
                                                    type="color"
                                                    className="h-11 w-14 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                                                    value={/^#[0-9a-fA-F]{6}$/.test(form[c.key] || '') ? form[c.key] : '#000000'}
                                                    onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                                                />
                                                <input
                                                    className={inputClass}
                                                    value={form[c.key] || ''}
                                                    onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <p className={labelClass}>Palet Cepat</p>
                                    <div className="flex flex-wrap gap-3">
                                        {PRESETS.map((p) => (
                                            <button
                                                key={p.name}
                                                type="button"
                                                onClick={() => setForm({ ...form, theme_bg: p.bg, theme_surface: p.surface, theme_primary: p.primary, theme_text: p.text })}
                                                className="flex items-center gap-2 border border-white/10 px-3 py-2 text-sm text-emerald-100/80 transition-colors hover:border-[var(--m-primary)] hover:text-white"
                                            >
                                                <span className="flex overflow-hidden rounded">
                                                    <span className="h-5 w-5" style={{ background: p.bg }} />
                                                    <span className="h-5 w-5" style={{ background: p.surface }} />
                                                    <span className="h-5 w-5" style={{ background: p.primary }} />
                                                </span>
                                                {p.name}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, ...THEME_DEFAULTS })}
                                            className="border border-white/15 px-3 py-2 text-sm text-emerald-100/60 transition-colors hover:text-white"
                                        >
                                            Reset Default
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={saveSettings}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-3 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                                        Simpan Tema
                                    </button>
                                </div>
                            </div>

                            {/* Right: live dashboard-style preview */}
                            <div className="border border-white/10 bg-white/[0.03] p-4 sm:p-5 xl:sticky xl:top-4">
                                <p className={labelClass}>Pratinjau Langsung</p>
                                <div
                                    className="mt-4 overflow-hidden rounded border border-white/10"
                                    style={{ background: form.theme_bg || THEME_DEFAULTS.theme_bg }}
                                >
                                    {/* Mini header */}
                                    <div
                                        className="flex items-center justify-between gap-3 border-b px-4 py-3"
                                        style={{
                                            borderColor: 'color-mix(in srgb, ' + (form.theme_text || THEME_DEFAULTS.theme_text) + ' 12%, transparent)',
                                            background: form.theme_surface || THEME_DEFAULTS.theme_surface,
                                        }}
                                    >
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: form.theme_primary || THEME_DEFAULTS.theme_primary }}>
                                                Dashboard Masjid
                                            </p>
                                            <p className="mt-0.5 font-display text-base leading-tight" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>
                                                {form.mosque_name || 'Masjid Al-Amanah'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-num text-2xl leading-none" style={{ color: form.theme_primary || THEME_DEFAULTS.theme_primary }}>
                                                04:30
                                            </p>
                                            <p className="mt-0.5 text-[10px]" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text, opacity: 0.55 }}>
                                                Rabu, 12 Agu
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-4">
                                        {/* Next prayer card */}
                                        <div
                                            className="rounded p-4"
                                            style={{ background: form.theme_surface || THEME_DEFAULTS.theme_surface }}
                                        >
                                            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: form.theme_primary || THEME_DEFAULTS.theme_primary }}>
                                                Menuju waktu
                                            </p>
                                            <p className="mt-1.5 font-display text-2xl" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>
                                                Subuh — 04:42
                                            </p>
                                            <p className="mt-1 text-xs" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text, opacity: 0.65 }}>
                                                00 jam 12 menit lagi
                                            </p>
                                        </div>

                                        {/* Saldo mini */}
                                        <div
                                            className="rounded border p-3"
                                            style={{
                                                borderColor: 'color-mix(in srgb, ' + (form.theme_primary || THEME_DEFAULTS.theme_primary) + ' 35%, transparent)',
                                                background: form.theme_surface || THEME_DEFAULTS.theme_surface,
                                            }}
                                        >
                                            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: form.theme_primary || THEME_DEFAULTS.theme_primary }}>
                                                Saldo Perpekan Jumat
                                            </p>
                                            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                                <div>
                                                    <p className="text-[9px] uppercase opacity-50" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>Masuk</p>
                                                    <p className="font-num text-sm" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>1.2jt</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase opacity-50" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>Keluar</p>
                                                    <p className="font-num text-sm" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>450rb</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase opacity-50" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>Sisa</p>
                                                    <p className="font-num text-sm" style={{ color: form.theme_primary || THEME_DEFAULTS.theme_primary }}>750rb</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Prayer times row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { name: 'Subuh', time: '04:42', active: true },
                                                { name: 'Dzuhur', time: '12:05', active: false },
                                                { name: 'Ashar', time: '15:20', active: false },
                                            ].map((p) => (
                                                <div
                                                    key={p.name}
                                                    className="rounded border px-2 py-2.5 text-center"
                                                    style={
                                                        p.active
                                                            ? {
                                                                background: form.theme_primary || THEME_DEFAULTS.theme_primary,
                                                                borderColor: form.theme_primary || THEME_DEFAULTS.theme_primary,
                                                                color: form.theme_surface || THEME_DEFAULTS.theme_surface,
                                                            }
                                                            : {
                                                                background: form.theme_surface || THEME_DEFAULTS.theme_surface,
                                                                borderColor: 'color-mix(in srgb, ' + (form.theme_primary || THEME_DEFAULTS.theme_primary) + ' 40%, transparent)',
                                                                color: form.theme_primary || THEME_DEFAULTS.theme_primary,
                                                            }
                                                    }
                                                >
                                                    <p className="text-[9px] uppercase tracking-wider opacity-80">{p.name}</p>
                                                    <p className="font-num text-base leading-tight">{p.time}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Iqomah sample */}
                                        <div
                                            className="rounded border px-3 py-2.5 text-center"
                                            style={{
                                                borderColor: form.theme_iqomah || THEME_DEFAULTS.theme_iqomah || '#22c55e',
                                                background: 'color-mix(in srgb, ' + (form.theme_iqomah || THEME_DEFAULTS.theme_iqomah || '#22c55e') + ' 12%, transparent)',
                                                color: form.theme_iqomah || THEME_DEFAULTS.theme_iqomah || '#22c55e',
                                            }}
                                        >
                                            <p className="text-[9px] uppercase tracking-[0.2em]">Iqomah Subuh</p>
                                            <p className="font-num text-lg leading-tight">04:52</p>
                                        </div>

                                        {/* Quote strip */}
                                        <div
                                            className="rounded px-3 py-3 text-center"
                                            style={{ background: form.theme_surface || THEME_DEFAULTS.theme_surface }}
                                        >
                                            <p className="font-display text-sm leading-snug" style={{ color: form.theme_text || THEME_DEFAULTS.theme_text }}>
                                                {form.quote || 'Sesungguhnya sholat itu mencegah dari perbuatan keji dan mungkar.'}
                                            </p>
                                            <p className="mt-1.5 text-[10px] uppercase tracking-wider" style={{ color: form.theme_primary || THEME_DEFAULTS.theme_primary }}>
                                                {form.quote_source || 'QS. Al-Ankabut: 45'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-emerald-100/45">
                                    Pratinjau diperbarui otomatis saat Anda mengubah warna.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : tab === 'pwa' ? (
                    <div className="max-w-5xl space-y-6">
                        <div>
                            <h2 className="font-display text-xl text-white">Pengaturan PWA (Aplikasi Terinstall)</h2>
                            <p className="mt-1 text-sm text-emerald-100/55">
                                Atur identitas aplikasi saat dipasang ke desktop, laptop, tablet, Android, dan iOS. Perubahan tersimpan ke database dan diterapkan real-time ke manifest &amp; tampilan aplikasi.
                            </p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <label className={labelClass} htmlFor="pwa_app_name">Nama Aplikasi</label>
                                <input id="pwa_app_name" className={inputClass} value={form.pwa_app_name || ''} onChange={(e) => setForm({ ...form, pwa_app_name: e.target.value })} placeholder="Dashboard Masjid Al-Amanah" />
                                <p className="text-xs text-emerald-100/45">Tampil sebagai judul penuh pada layar install / app launcher.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={labelClass} htmlFor="pwa_short_name">Nama Singkat</label>
                                <input id="pwa_short_name" className={inputClass} maxLength={30} value={form.pwa_short_name || ''} onChange={(e) => setForm({ ...form, pwa_short_name: e.target.value })} placeholder="Masjid" />
                                <p className="text-xs text-emerald-100/45">Tampil di ikon home screen (maks. 30 karakter).</p>
                            </div>
                            <div className="flex flex-col gap-2 lg:col-span-2">
                                <label className={labelClass} htmlFor="pwa_description">Deskripsi Aplikasi</label>
                                <textarea id="pwa_description" rows={3} className={inputClass} value={form.pwa_description || ''} onChange={(e) => setForm({ ...form, pwa_description: e.target.value })} placeholder="Dashboard masjid dengan jadwal sholat, iqomah, saldo jumat, dan slideshow informasi jamaah." />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-5">
                                <label className={labelClass} htmlFor="pwa_theme_color">Warna Tema (Theme Color)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="pwa_theme_color"
                                        type="color"
                                        className="h-11 w-14 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                                        value={/^#[0-9a-fA-F]{6}$/.test(form.pwa_theme_color || '') ? form.pwa_theme_color : '#04100c'}
                                        onChange={(e) => setForm({ ...form, pwa_theme_color: e.target.value })}
                                    />
                                    <input
                                        className={inputClass}
                                        value={form.pwa_theme_color || ''}
                                        onChange={(e) => setForm({ ...form, pwa_theme_color: e.target.value })}
                                        placeholder="#04100c"
                                    />
                                </div>
                                <p className="text-xs text-emerald-100/45">Warna bilah status / judul jendela aplikasi terinstall.</p>
                            </div>
                            <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-5">
                                <label className={labelClass} htmlFor="pwa_bg_color">Warna Latar (Splash)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="pwa_bg_color"
                                        type="color"
                                        className="h-11 w-14 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                                        value={/^#[0-9a-fA-F]{6}$/.test(form.pwa_bg_color || '') ? form.pwa_bg_color : '#04100c'}
                                        onChange={(e) => setForm({ ...form, pwa_bg_color: e.target.value })}
                                    />
                                    <input
                                        className={inputClass}
                                        value={form.pwa_bg_color || ''}
                                        onChange={(e) => setForm({ ...form, pwa_bg_color: e.target.value })}
                                        placeholder="#04100c"
                                    />
                                </div>
                                <p className="text-xs text-emerald-100/45">Warna latar layar splash saat aplikasi dibuka.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-5">
                            <label className={labelClass} htmlFor="pwa_logo">Logo / Ikon Aplikasi</label>
                            <input
                                id="pwa_logo"
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
                                onChange={(e) => setPwaLogoFile(e.target.files[0] || null)}
                                className={inputClass}
                            />
                            <p className="text-xs text-emerald-100/45">Mendukung PNG, JPG, SVG, ICO. Maks. 5 MB. Digunakan sebagai ikon aplikasi pada semua ukuran (192/512/1024) &amp; apple-touch-icon.</p>
                            <div className="mt-2 flex flex-wrap items-center gap-4">
                                {pwaLogoFile ? (
                                    <div className="flex items-center gap-3">
                                        <img src={URL.createObjectURL(pwaLogoFile)} alt="Pratinjau logo PWA" className="h-16 w-16 rounded object-contain bg-white/5 ring-1 ring-white/10" />
                                        <span className="text-xs text-emerald-100/55">{pwaLogoFile.name} (belum disimpan)</span>
                                    </div>
                                ) : settings && settings.pwa_logo ? (
                                    <div className="flex items-center gap-3">
                                        <img src={fileUrl(settings, settings.pwa_logo)} alt="Logo PWA saat ini" className="h-16 w-16 rounded object-contain bg-white/5 ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" />
                                        <span className="text-xs text-emerald-100/55">Logo PWA saat ini</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <img src="/icons/icon-512.png" alt="Logo default" className="h-16 w-16 rounded object-contain bg-white/5 ring-1 ring-white/10" />
                                        <span className="text-xs text-emerald-100/45">Menggunakan ikon default.</span>
                                    </div>
                                )}
                                {settings && settings.pwa_logo && !pwaLogoFile ? (
                                    <button
                                        type="button"
                                        onClick={deletePwaLogo}
                                        disabled={pwaLogoBusy}
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                    >
                                        {pwaLogoBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />} Hapus Logo
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={saveSettings}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-3 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                            Simpan Pengaturan PWA
                        </button>
                    </div>
                ) : tab === 'database' ? (
                    <DatabaseTab />
                ) : null}
            </main>
        </div>
    );
};

export default AdminPage;
