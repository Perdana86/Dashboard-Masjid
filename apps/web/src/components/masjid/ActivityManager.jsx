import React, { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, Plus, ArrowUp, ArrowDown, Pencil, X, Image as ImageIcon, Video, Youtube } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { fileUrl, youtubeVideoId, isAbortError } from '@/lib/masjid';

const inputClass =
    'w-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-white outline-none transition-colors placeholder:text-emerald-100/30 focus:border-[var(--m-primary)]';
const labelClass = 'text-xs uppercase tracking-[0.2em] text-emerald-100/60';

const emptyForm = () => ({
    id: null,
    title: '',
    description: '',
    video_youtube: '',
    active: true,
});

const ActivityManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [form, setForm] = useState(emptyForm());
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [editing, setEditing] = useState(false);

    const flash = (msg) => {
        setStatus(msg);
        setTimeout(() => setStatus(''), 2500);
    };

    const load = async () => {
        setError('');
        try {
            const list = await pb.collection('activities').getFullList({
                sort: 'position,created',
                requestKey: 'admin-activities',
            });
            setItems(list || []);
        } catch (e) {
            if (!isAbortError(e)) setError(e.message || 'Gagal memuat kegiatan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const resetForm = () => {
        setForm(emptyForm());
        setImageFile(null);
        setVideoFile(null);
        setEditing(false);
    };

    const startEdit = (item) => {
        setForm({
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            video_youtube: item.video_youtube || '',
            active: item.active !== false,
        });
        setImageFile(null);
        setVideoFile(null);
        setEditing(true);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!form.title.trim()) {
            setError('Judul kegiatan wajib diisi.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('title', form.title.trim());
            fd.append('description', form.description || '');
            fd.append('video_youtube', form.video_youtube.trim());
            fd.append('active', form.active === false ? 'false' : 'true');
            if (imageFile) fd.append('image', imageFile);
            if (videoFile) fd.append('video_local', videoFile);

            if (form.id) {
                await pb.collection('activities').update(form.id, fd);
                flash('Kegiatan diperbarui.');
            } else {
                const nextPos = items.length > 0 ? Math.max(...items.map((l) => Number(l.position) || 0)) + 1 : 0;
                fd.append('position', String(nextPos));
                await pb.collection('activities').create(fd, { requestKey: `create-activity-${Date.now()}` });
                flash('Kegiatan ditambahkan.');
            }
            resetForm();
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menyimpan kegiatan');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (item) => {
        if (!window.confirm(`Hapus kegiatan "${item.title}"?`)) return;
        setBusy(true);
        setError('');
        try {
            await pb.collection('activities').delete(item.id, { requestKey: `del-activity-${item.id}` });
            flash('Kegiatan dihapus.');
            if (form.id === item.id) resetForm();
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus kegiatan');
        } finally {
            setBusy(false);
        }
    };

    const removeImage = async (item) => {
        if (!item || !item.image) return;
        setBusy(true);
        setError('');
        try {
            await pb.collection('activities').update(item.id, { image: null });
            flash('Gambar dihapus.');
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus gambar');
        } finally {
            setBusy(false);
        }
    };

    const removeVideo = async (item) => {
        if (!item || !item.video_local) return;
        setBusy(true);
        setError('');
        try {
            await pb.collection('activities').update(item.id, { video_local: null });
            flash('Video lokal dihapus.');
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal menghapus video');
        } finally {
            setBusy(false);
        }
    };

    const move = async (item, dir) => {
        const sorted = [...items].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
        const idx = sorted.findIndex((l) => l.id === item.id);
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
                pb.collection('activities').update(a.id, { position: pb_ }, { requestKey: `mv-a-${a.id}` }),
                pb.collection('activities').update(b.id, { position: pa }, { requestKey: `mv-b-${b.id}` }),
            ]);
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal mengubah urutan');
        } finally {
            setBusy(false);
        }
    };

    const toggleActive = async (item) => {
        setBusy(true);
        setError('');
        try {
            await pb.collection('activities').update(item.id, { active: item.active === false ? 'true' : 'false' });
            await load();
        } catch (err) {
            if (!isAbortError(err)) setError(err.message || 'Gagal mengubah status');
        } finally {
            setBusy(false);
        }
    };

    const sortedItems = [...items].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
    const current = form.id ? items.find((l) => l.id === form.id) : null;

    return (
        <div className="max-w-5xl space-y-6">
            <div>
                <h2 className="font-display text-xl text-white">Kegiatan Masjid</h2>
                <p className="mt-1 text-sm text-emerald-100/55">
                    Tambah, edit, hapus, dan atur urutan kegiatan yang tampil di halaman /activity. Setiap kegiatan dapat berisi gambar (PNG/JPG/SVG, maks. 5 MB), video lokal (maks. 200 MB), dan tautan YouTube. Perubahan sinkron real-time ke halaman /activity.
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
                        {editing ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
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

                <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="activity_title">Judul Kegiatan</label>
                    <input
                        id="activity_title"
                        className={inputClass}
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Mis. Pengajian Rutin Malam Jumat"
                        maxLength={200}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="activity_description">Deskripsi Kegiatan</label>
                    <textarea
                        id="activity_description"
                        rows={4}
                        className={inputClass}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Jadwal, pemateri, lokasi, dan informasi detail kegiatan. Pisahkan paragraf dengan baris baru."
                    />
                </div>

                {/* Image upload */}
                <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="activity_image">Gambar Kegiatan (PNG/JPG/SVG/WebP/GIF/AVIF, maks. 5 MB)</label>
                    <input
                        id="activity_image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
                        onChange={(e) => setImageFile(e.target.files[0] || null)}
                        className={inputClass}
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                        {imageFile ? (
                            <div className="flex items-center gap-3">
                                <img src={URL.createObjectURL(imageFile)} alt="Pratinjau gambar" className="h-20 w-32 rounded object-cover ring-1 ring-white/10" />
                                <span className="text-xs text-emerald-100/55">{imageFile.name} (belum disimpan)</span>
                            </div>
                        ) : current && current.image ? (
                            <div className="flex items-center gap-3">
                                <img src={fileUrl(current, current.image)} alt="Gambar saat ini" className="h-20 w-32 rounded object-cover ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" />
                                <span className="text-xs text-emerald-100/55">Gambar saat ini</span>
                                <button
                                    type="button"
                                    onClick={() => removeImage(current)}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus Gambar
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-emerald-100/45">Belum ada gambar.</span>
                        )}
                    </div>
                </div>

                {/* Local video upload */}
                <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="activity_video">Video Lokal (MP4/WebM/MOV/MKV/AVI, maks. 200 MB)</label>
                    <input
                        id="activity_video"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/x-msvideo"
                        onChange={(e) => setVideoFile(e.target.files[0] || null)}
                        className={inputClass}
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                        {videoFile ? (
                            <div className="flex items-center gap-3">
                                <video src={URL.createObjectURL(videoFile)} className="h-20 w-32 rounded bg-black object-cover ring-1 ring-white/10" muted />
                                <span className="text-xs text-emerald-100/55">{videoFile.name} (belum disimpan)</span>
                            </div>
                        ) : current && current.video_local ? (
                            <div className="flex items-center gap-3">
                                <video src={fileUrl(current, current.video_local)} className="h-20 w-32 rounded bg-black object-cover ring-1 ring-[color-mix(in_srgb,var(--m-primary)_50%,transparent)]" muted controls />
                                <span className="text-xs text-emerald-100/55">Video saat ini</span>
                                <button
                                    type="button"
                                    onClick={() => removeVideo(current)}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus Video
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-emerald-100/45">Belum ada video lokal.</span>
                        )}
                    </div>
                </div>

                {/* YouTube URL */}
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="activity_youtube">URL Video YouTube (opsional)</label>
                    <input
                        id="activity_youtube"
                        type="url"
                        className={inputClass}
                        value={form.video_youtube}
                        onChange={(e) => setForm({ ...form, video_youtube: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {form.video_youtube && youtubeVideoId(form.video_youtube) ? (
                        <p className="text-xs text-emerald-100/45">ID YouTube terdeteksi: {youtubeVideoId(form.video_youtube)}</p>
                    ) : form.video_youtube ? (
                        <p className="text-xs text-amber-200/70">URL YouTube tidak dikenali.</p>
                    ) : null}
                </div>

                <label className="flex items-center gap-3 text-sm text-emerald-100/80">
                    <input
                        type="checkbox"
                        checked={form.active !== false}
                        onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    Tampilkan kegiatan ini di halaman /activity
                </label>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-6 py-2.5 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                        {editing ? 'Perbarui Kegiatan' : 'Tambah Kegiatan'}
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--m-primary)]">Daftar Kegiatan ({sortedItems.length})</h3>
                {loading ? (
                    <div className="space-y-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-24 animate-pulse rounded bg-white/[0.05]" />
                        ))}
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div className="border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-emerald-100/55">
                        Belum ada kegiatan. Tambahkan menggunakan formulir di atas.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedItems.map((item, i) => {
                            const imageUrl = item.image ? fileUrl(item, item.image) : '';
                            const hasVideo = !!item.video_local;
                            const hasYt = !!youtubeVideoId(item.video_youtube);
                            return (
                                <div
                                    key={item.id}
                                    className={`flex flex-wrap items-center gap-3 border bg-white/[0.03] p-3 sm:p-4 ${
                                        form.id === item.id ? 'border-[var(--m-primary)]' : 'border-white/10'
                                    }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            type="button"
                                            onClick={() => move(item, -1)}
                                            disabled={busy || i === 0}
                                            className="inline-flex h-7 w-7 items-center justify-center border border-white/15 text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-30"
                                            title="Naikkan urutan"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(item, 1)}
                                            disabled={busy || i === sortedItems.length - 1}
                                            className="inline-flex h-7 w-7 items-center justify-center border border-white/15 text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-30"
                                            title="Turunkan urutan"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                                        </button>
                                    </div>

                                    <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-[color-mix(in_srgb,var(--m-primary)_40%,transparent)] bg-[var(--m-surface)]/60">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-5 w-5 text-[var(--m-primary)]/50" strokeWidth={1.75} />
                                        )}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-emerald-50/90">{item.title}</p>
                                        {item.description ? (
                                            <p className="mt-0.5 line-clamp-1 text-xs text-emerald-100/45">{item.description.split('\n')[0]}</p>
                                        ) : null}
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-100/45">
                                            {hasVideo ? (
                                                <span className="inline-flex items-center gap-1 border border-white/10 px-1.5 py-0.5"><Video className="h-3 w-3" /> Video</span>
                                            ) : null}
                                            {hasYt ? (
                                                <span className="inline-flex items-center gap-1 border border-white/10 px-1.5 py-0.5"><Youtube className="h-3 w-3" /> YouTube</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <span
                                        className={`hidden rounded px-2 py-0.5 text-[10px] uppercase tracking-wider sm:inline-block ${
                                            item.active === false
                                                ? 'border border-amber-400/40 text-amber-200/80'
                                                : 'border border-emerald-400/40 text-emerald-200/80'
                                        }`}
                                    >
                                        {item.active === false ? 'Disembunyikan' : 'Tampil'}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(item)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-60"
                                            title={item.active === false ? 'Tampilkan' : 'Sembunyikan'}
                                        >
                                            {item.active === false ? 'Tampilkan' : 'Sembunyikan'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(item)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-[var(--m-primary)] hover:text-[var(--m-primary)] disabled:opacity-60"
                                        >
                                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(item)}
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

export default ActivityManager;
