import React, { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, Upload, Plus, ArrowUp, ArrowDown, Pencil, X, Link as LinkIcon } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { fileUrl, isAbortError } from '@/lib/masjid';

const inputClass =
    'w-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-white outline-none transition-colors placeholder:text-emerald-100/30 focus:border-[var(--m-primary)]';
const labelClass = 'text-xs uppercase tracking-[0.2em] text-emerald-100/60';

const emptyForm = () => ({
    id: null,
    label: '',
    url: '',
    active: true,
});

const BioLinkManager = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [form, setForm] = useState(emptyForm());
    const [iconFile, setIconFile] = useState(null);
    const [editing, setEditing] = useState(false);

    const flash = (msg) => {
        setStatus(msg);
        setTimeout(() => setStatus(''), 2500);
    };

    const load = async () => {
        setError('');
        try {
            const list = await pb.collection('bio_links').getFullList({
                sort: 'position,created',
                requestKey: 'admin-bio-links',
            });
            setLinks(list || []);
        } catch (e) {
            if (!isAbortError(e)) setError(e.message || 'Gagal memuat tombol link');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const resetForm = () => {
        setForm(emptyForm());
        setIconFile(null);
        setEditing(false);
    };

    const startEdit = (link) => {
        setForm({ id: link.id, label: link.label || '', url: link.url || '', active: link.active !== false });
        setIconFile(null);
        setEditing(true);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!form.label.trim() || !form.url.trim()) {
            setError('Nama dan URL wajib diisi.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('label', form.label.trim());
            fd.append('url', form.url.trim());
            fd.append('active', form.active === false ? 'false' : 'true');
            if (iconFile) fd.append('icon', iconFile);

            if (form.id) {
                await pb.collection('bio_links').update(form.id, fd);
                flash('Tombol link diperbarui.');
            } else {
                const nextPos = links.length > 0 ? Math.max(...links.map((l) => Number(l.position) || 0)) + 1 : 0;
                fd.append('position', String(nextPos));
                await pb.collection('bio_links').create(fd, { requestKey: `create-bio-link-${Date.now()}` });
                flash('Tombol link ditambahkan.');
            }
            resetForm();
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menyimpan tombol link');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (link) => {
        if (!window.confirm(`Hapus tombol link "${link.label}"?`)) return;
        setBusy(true);
        setError('');
        try {
            await pb.collection('bio_links').delete(link.id, { requestKey: `del-bio-link-${link.id}` });
            flash('Tombol link dihapus.');
            if (form.id === link.id) resetForm();
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus tombol link');
        } finally {
            setBusy(false);
        }
    };

    const removeIcon = async (link) => {
        if (!link || !link.icon) return;
        setBusy(true);
        setError('');
        try {
            await pb.collection('bio_links').update(link.id, { icon: null });
            flash('Ikon dihapus.');
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus ikon');
        } finally {
            setBusy(false);
        }
    };

    const move = async (link, dir) => {
        const sorted = [...links].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
        const idx = sorted.findIndex((l) => l.id === link.id);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const a = sorted[idx];
        const b = sorted[swapIdx];
        const pa = Number(a.position) || 0;
        const pb_ = Number(b.position) || 0;
        setBusy(true);
        setError('');
        try {
            await Promise.all([
                pb.collection('bio_links').update(a.id, { position: pb_ }, { requestKey: `mv-a-${a.id}` }),
                pb.collection('bio_links').update(b.id, { position: pa }, { requestKey: `mv-b-${b.id}` }),
            ]);
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal mengubah urutan');
        } finally {
            setBusy(false);
        }
    };

    const toggleActive = async (link) => {
        setBusy(true);
        setError('');
        try {
            await pb.collection('bio_links').update(link.id, { active: link.active === false ? 'true' : 'false' });
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal mengubah status');
        } finally {
            setBusy(false);
        }
    };

    const sortedLinks = [...links].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));

    return (
        <div className="max-w-5xl space-y-6">
            <div>
                <h2 className="font-display text-xl text-white">Tombol Link</h2>
                <p className="mt-1 text-sm text-emerald-100/55">
                    Tambah, edit, hapus, dan atur urutan tombol link yang tampil di halaman /bio. Setiap tombol memiliki nama, URL tujuan, dan ikon (PNG/JPG/SVG/ICO/WebP, maks. 5 MB). Perubahan sinkron real-time ke halaman /bio.
                </p>
            </div>

            {status ? (
                <p className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">{status}</p>
            ) : null}
            {error ? (
                <p className="border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-200">{error}</p>
            ) : null}

            {/* Add / edit form */}
            <form onSubmit={submit} className="space-y-4 border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)]">
                        {editing ? 'Edit Tombol Link' : 'Tambah Tombol Link'}
                    </h3>
                    {editing ? (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-white/40 hover:text-white"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={1.75} /> Batal Edit
                        </button>
                    ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor="link_label">Nama / Label Tombol</label>
                        <input
                            id="link_label"
                            className={inputClass}
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            placeholder="Mis. Website Resmi"
                            maxLength={120}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor="link_url">URL Tujuan</label>
                        <input
                            id="link_url"
                            type="url"
                            className={inputClass}
                            value={form.url}
                            onChange={(e) => setForm({ ...form, url: e.target.value })}
                            placeholder="https://contoh.com"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="link_icon">Ikon / Logo (opsional)</label>
                    <input
                        id="link_icon"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp,.ico"
                        onChange={(e) => setIconFile(e.target.files[0] || null)}
                        className={inputClass}
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                        {iconFile ? (
                            <div className="flex items-center gap-3">
                                <img src={URL.createObjectURL(iconFile)} alt="Pratinjau ikon" className="h-12 w-12 rounded object-contain bg-white/5 ring-1 ring-white/10" />
                                <span className="text-xs text-emerald-100/55">{iconFile.name} (belum disimpan)</span>
                            </div>
                        ) : editing && form.id ? (
                            (() => {
                                const current = links.find((l) => l.id === form.id);
                                if (current && current.icon) {
                                    return (
                                        <div className="flex items-center gap-3">
                                            <img src={fileUrl(current, current.icon)} alt="Ikon saat ini" className="h-12 w-12 rounded object-contain bg-white/5 ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" />
                                            <span className="text-xs text-emerald-100/55">Ikon saat ini</span>
                                            <button
                                                type="button"
                                                onClick={() => removeIcon(current)}
                                                disabled={busy}
                                                className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus Ikon
                                            </button>
                                        </div>
                                    );
                                }
                                return <span className="text-xs text-emerald-100/45">Belum ada ikon.</span>;
                            })()
                        ) : (
                            <span className="text-xs text-emerald-100/45">Belum ada ikon. PNG/JPG/SVG/ICO/WebP, maks. 5 MB.</span>
                        )}
                    </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-emerald-100/80">
                    <input
                        type="checkbox"
                        checked={form.active !== false}
                        onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    Tampilkan tombol ini di halaman /bio
                </label>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-2.5 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                        {editing ? 'Perbarui Tombol' : 'Tambah Tombol'}
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)]">Daftar Tombol Link ({sortedLinks.length})</h3>
                {loading ? (
                    <div className="space-y-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-20 animate-pulse rounded bg-white/[0.05]" />
                        ))}
                    </div>
                ) : sortedLinks.length === 0 ? (
                    <div className="border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-emerald-100/55">
                        Belum ada tombol link. Tambahkan menggunakan formulir di atas.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedLinks.map((link, i) => {
                            const icon = link.icon ? fileUrl(link, link.icon) : '';
                            return (
                                <div
                                    key={link.id}
                                    className={`flex flex-wrap items-center gap-3 border bg-white/[0.03] p-3 sm:p-4 ${
                                        form.id === link.id ? 'border-[var(--m-primary)]' : 'border-white/10'
                                    }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            type="button"
                                            onClick={() => move(link, -1)}
                                            disabled={busy || i === 0}
                                            className="inline-flex h-7 w-7 items-center justify-center border border-white/15 text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-30"
                                            title="Naikkan urutan"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(link, 1)}
                                            disabled={busy || i === sortedLinks.length - 1}
                                            className="inline-flex h-7 w-7 items-center justify-center border border-white/15 text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-30"
                                            title="Turunkan urutan"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                                        </button>
                                    </div>

                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-[color-mix(in_srgb,var(--m-primary)_40%,transparent)] bg-[var(--m-surface)]/60">
                                        {icon ? (
                                            <img src={icon} alt="" className="h-full w-full object-contain p-1.5" />
                                        ) : (
                                            <LinkIcon className="h-5 w-5 text-[var(--m-primary)]" strokeWidth={1.75} />
                                        )}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-emerald-50/90">{link.label}</p>
                                        <p className="mt-0.5 truncate text-xs text-emerald-100/45">{link.url}</p>
                                    </div>

                                    <span
                                        className={`hidden rounded px-2 py-0.5 text-[10px] uppercase tracking-wider sm:inline-block ${
                                            link.active === false
                                                ? 'border border-amber-400/40 text-amber-200/80'
                                                : 'border border-emerald-400/40 text-emerald-200/80'
                                        }`}
                                    >
                                        {link.active === false ? 'Disembunyikan' : 'Tampil'}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(link)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-60"
                                            title={link.active === false ? 'Tampilkan' : 'Sembunyikan'}
                                        >
                                            {link.active === false ? 'Tampilkan' : 'Sembunyikan'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(link)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-60"
                                        >
                                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(link)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BioLinkManager;
