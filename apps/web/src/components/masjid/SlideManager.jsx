import React, { useEffect, useState } from 'react';
import { FileText, Globe, Loader2, Plus, Save, Trash2, Type, Video, Youtube } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { slideImage, slideMediaType, slideVideo, isVideoSlide, youtubeEmbedUrl } from '@/lib/masjid';

const inputClass =
  'w-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-white outline-none transition-colors placeholder:text-emerald-100/30 focus:border-[var(--m-primary)]';
const labelClass = 'text-xs uppercase tracking-[0.2em] text-emerald-100/60';

const FONT_SIZES = [
  { value: 'sm',  label: 'Kecil' },
  { value: 'md',  label: 'Sedang' },
  { value: 'lg',  label: 'Besar' },
  { value: 'xl',  label: 'Sangat Besar' },
  { value: '2xl', label: 'Jumbo' },
];

const emptySlide = {
  title: '', caption: '', image_url: '', video_url: '', website_url: '', youtube_url: '', position: 0, active: true, media_type: 'auto',
  slide_type: 'image',
  text_content: '', text_translation: '', text_font_size: 'lg',
  text_color: '#ecfdf5', text_bg: '#0d2019', text_align: 'center',
};

const SlideManager = ({ collection, heading, description, onCountChange }) => {
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [newSlide, setNewSlide] = useState(emptySlide);
  const [newSlideFile, setNewSlideFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const list = await pb.collection(collection).getFullList({ sort: 'position,created' });
      setSlides(list);
      if (onCountChange) onCountChange(list.length);
    } catch (e) {
      setError(e.message || 'Gagal memuat slide');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  const flash = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 2500); };

  const addSlide = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', newSlide.title);
      fd.append('caption', newSlide.caption);
      fd.append('position', String(Number(newSlide.position) || slides.length + 1));
      fd.append('active', String(newSlide.active));
      fd.append('slide_type', newSlide.slide_type || 'image');

      if (newSlide.slide_type === 'website') {
        fd.append('website_url', newSlide.website_url || '');
      } else if (newSlide.slide_type === 'youtube') {
        fd.append('youtube_url', newSlide.youtube_url || '');
      } else if (newSlide.slide_type === 'text') {
        fd.append('text_content', newSlide.text_content || '');
        fd.append('text_translation', newSlide.text_translation || '');
        fd.append('text_font_size', newSlide.text_font_size || 'lg');
        fd.append('text_color', newSlide.text_color || '#ecfdf5');
        fd.append('text_bg', newSlide.text_bg || '#0d2019');
        fd.append('text_align', newSlide.text_align || 'center');
      } else if (newSlide.slide_type === 'video') {
        fd.append('video_url', newSlide.video_url || '');
        if (newSlideFile) fd.append('video', newSlideFile);
      } else {
        fd.append('image_url', newSlide.image_url);
        fd.append('media_type', newSlide.media_type || 'auto');
        if (newSlideFile) fd.append('image', newSlideFile);
      }

      const rec = await pb.collection(collection).create(fd, { requestKey: `add-${collection}-${Date.now()}` });
      const next = [...slides, rec].sort((a, b) => (a.position || 0) - (b.position || 0));
      setSlides(next);
      if (onCountChange) onCountChange(next.length);
      setNewSlide(emptySlide);
      setNewSlideFile(null);
      flash('Slide ditambahkan.');
    } catch (err) {
      setError(err.message || 'Gagal menambah slide');
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = async (slide, patch, file, fileField) => {
    setError('');
    try {
      let data = patch;
      if (file) {
        const fd = new FormData();
        Object.entries(patch).forEach(([k, v]) => fd.append(k, String(v ?? '')));
        fd.append(fileField || 'image', file);
        data = fd;
      }
      const rec = await pb.collection(collection).update(slide.id, data, { requestKey: `slide-${collection}-${slide.id}` });
      setSlides((prev) => prev.map((s) => (s.id === rec.id ? rec : s)));
      flash('Slide diperbarui.');
    } catch (err) {
      setError(err.message || 'Gagal memperbarui slide');
    }
  };

  const removeSlide = async (id) => {
    setError('');
    try {
      await pb.collection(collection).delete(id, { requestKey: `del-${collection}-${id}` });
      const next = slides.filter((s) => s.id !== id);
      setSlides(next);
      if (onCountChange) onCountChange(next.length);
      flash('Slide dihapus.');
    } catch (err) {
      setError(err.message || 'Gagal menghapus slide');
    }
  };

  const isText = newSlide.slide_type === 'text';
  const isVideo = newSlide.slide_type === 'video';
  const isWebsite = newSlide.slide_type === 'website';
  const isYoutube = newSlide.slide_type === 'youtube';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] xl:items-start xl:gap-8">
      <form onSubmit={addSlide} className="space-y-4 border border-white/10 bg-white/[0.03] p-5 sm:p-6 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto">
        <div>
          <h2 className="font-display text-xl text-white">{heading}</h2>
          {description && <p className="mt-1 text-sm text-emerald-100/55">{description}</p>}
        </div>

        {status && <p className="border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">{status}</p>}
        {error && <p className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}

        {/* Slide type toggle */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { type: 'image', icon: <FileText className="h-4 w-4" strokeWidth={1.75} />, label: 'Gambar / PDF' },
            { type: 'text',  icon: <Type className="h-4 w-4" strokeWidth={1.75} />,    label: 'Teks / Ayat' },
            { type: 'video', icon: <Video className="h-4 w-4" strokeWidth={1.75} />,   label: 'Video Lokal' },
            { type: 'youtube', icon: <Youtube className="h-4 w-4" strokeWidth={1.75} />, label: 'YouTube' },
            { type: 'website', icon: <Globe className="h-4 w-4" strokeWidth={1.75} />,  label: 'Website' },
          ].map(({ type, icon, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setNewSlide({ ...newSlide, slide_type: type })}
              className={`flex items-center justify-center gap-2 py-2 text-sm border transition-colors ${
                newSlide.slide_type === type
                  ? 'border-[var(--m-primary)] bg-[color-mix(in_srgb,var(--m-primary)_15%,transparent)] text-[var(--m-primary)]'
                  : 'border-white/15 text-emerald-100/60 hover:text-white'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Common fields */}
        <div className="flex flex-col gap-2">
          <label className={labelClass} htmlFor={`${collection}_title`}>Judul (opsional)</label>
          <input id={`${collection}_title`} className={inputClass} value={newSlide.title} onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })} />
        </div>

        {isText ? (
          <>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_text_content`}>Teks Utama (Ayat / Hadis)</label>
              <textarea id={`${collection}_text_content`} rows={4} className={`${inputClass} font-display text-lg`} placeholder="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" value={newSlide.text_content} onChange={(e) => setNewSlide({ ...newSlide, text_content: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_text_translation`}>Terjemahan / Keterangan</label>
              <textarea id={`${collection}_text_translation`} rows={3} className={inputClass} placeholder="Dengan menyebut nama Allah yang Maha Pengasih..." value={newSlide.text_translation} onChange={(e) => setNewSlide({ ...newSlide, text_translation: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_caption`}>Sumber / Label (mis. QS Al-Fatihah: 1)</label>
              <input id={`${collection}_caption`} className={inputClass} value={newSlide.caption} onChange={(e) => setNewSlide({ ...newSlide, caption: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className={labelClass} htmlFor={`${collection}_fontsize`}>Ukuran Font</label>
                <select id={`${collection}_fontsize`} className={inputClass} value={newSlide.text_font_size} onChange={(e) => setNewSlide({ ...newSlide, text_font_size: e.target.value })}>
                  {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass} htmlFor={`${collection}_align`}>Rata Teks</label>
                <select id={`${collection}_align`} className={inputClass} value={newSlide.text_align} onChange={(e) => setNewSlide({ ...newSlide, text_align: e.target.value })}>
                  <option value="left">Kiri</option>
                  <option value="center">Tengah</option>
                  <option value="right">Kanan</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Warna Teks</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-10 w-12 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                    value={/^#[0-9a-fA-F]{6}$/.test(newSlide.text_color) ? newSlide.text_color : '#ecfdf5'}
                    onChange={(e) => setNewSlide({ ...newSlide, text_color: e.target.value })} />
                  <input className={inputClass} value={newSlide.text_color} onChange={(e) => setNewSlide({ ...newSlide, text_color: e.target.value })} placeholder="#ecfdf5" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Warna Latar</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-10 w-12 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                    value={/^#[0-9a-fA-F]{6}$/.test(newSlide.text_bg) ? newSlide.text_bg : '#0d2019'}
                    onChange={(e) => setNewSlide({ ...newSlide, text_bg: e.target.value })} />
                  <input className={inputClass} value={newSlide.text_bg} onChange={(e) => setNewSlide({ ...newSlide, text_bg: e.target.value })} placeholder="#0d2019" />
                </div>
              </div>
            </div>
          </>
        ) : isYoutube ? (
          <>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_yturl`}>URL atau ID Video YouTube</label>
              <input id={`${collection}_yturl`} className={inputClass} placeholder="https://youtu.be/xxxx atau ID video" value={newSlide.youtube_url} onChange={(e) => setNewSlide({ ...newSlide, youtube_url: e.target.value })} />
              <p className="text-xs text-emerald-100/45">Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ atau cukup ID-nya: dQw4w9WgXcQ</p>
            </div>
            {newSlide.youtube_url && youtubeEmbedUrl(newSlide.youtube_url) && (
              <div className="aspect-video w-full overflow-hidden border border-white/10">
                <iframe
                  src={youtubeEmbedUrl(newSlide.youtube_url)}
                  title="YouTube preview"
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_ytpos`}>Urutan</label>
              <input id={`${collection}_ytpos`} type="number" className={inputClass} value={newSlide.position} onChange={(e) => setNewSlide({ ...newSlide, position: e.target.value })} />
            </div>
          </>
        ) : isWebsite ? (
          <>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_wsurl`}>URL Website</label>
              <input id={`${collection}_wsurl`} className={inputClass} placeholder="https://example.com" value={newSlide.website_url} onChange={(e) => setNewSlide({ ...newSlide, website_url: e.target.value })} />
              <p className="text-xs text-emerald-100/45">Pastikan website yang dituju mengizinkan tampilan dalam iframe (tidak memblokir X-Frame-Options).</p>
            </div>
            {newSlide.website_url && (
              <div className="aspect-video w-full overflow-hidden border border-white/10 bg-white">
                <iframe
                  src={newSlide.website_url}
                  title="Website preview"
                  className="h-full w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_wspos`}>Urutan</label>
              <input id={`${collection}_wspos`} type="number" className={inputClass} value={newSlide.position} onChange={(e) => setNewSlide({ ...newSlide, position: e.target.value })} />
            </div>
          </>
        ) : isVideo ? (
          <>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_caption`}>Keterangan</label>
              <textarea id={`${collection}_caption`} rows={3} className={inputClass} value={newSlide.caption} onChange={(e) => setNewSlide({ ...newSlide, caption: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_videofile`}>Unggah Video</label>
              <input id={`${collection}_videofile`} type="file" accept="video/*" className={inputClass} onChange={(e) => setNewSlideFile(e.target.files[0] || null)} />
              <p className="text-xs text-emerald-100/45">Mendukung MP4, WebM, Ogg. Full HD (1080p) dan resolusi lainnya, maks. 200MB.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_videourl`}>atau URL Video</label>
              <input id={`${collection}_videourl`} className={inputClass} placeholder="https://.../video.mp4" value={newSlide.video_url} onChange={(e) => setNewSlide({ ...newSlide, video_url: e.target.value })} />
            </div>
            {newSlideFile ? (
              <div className="border border-white/10 bg-black p-2">
                <video src={URL.createObjectURL(newSlideFile)} className="max-h-48 w-full object-contain" controls muted loop playsInline />
                <p className="mt-1 text-xs text-emerald-100/45">Pratinjau video sebelum disimpan.</p>
              </div>
            ) : newSlide.video_url ? (
              <div className="border border-white/10 bg-black p-2">
                <video src={newSlide.video_url} className="max-h-48 w-full object-contain" controls muted loop playsInline />
                <p className="mt-1 text-xs text-emerald-100/45">Pratinjau dari URL.</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_videopos`}>Urutan</label>
              <input id={`${collection}_videopos`} type="number" className={inputClass} value={newSlide.position} onChange={(e) => setNewSlide({ ...newSlide, position: e.target.value })} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_caption`}>Keterangan</label>
              <textarea id={`${collection}_caption`} rows={3} className={inputClass} value={newSlide.caption} onChange={(e) => setNewSlide({ ...newSlide, caption: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_file`}>Unggah Gambar / PDF</label>
              <input id={`${collection}_file`} type="file" accept="image/*,application/pdf" className={inputClass} onChange={(e) => setNewSlideFile(e.target.files[0] || null)} />
              <p className="text-xs text-emerald-100/45">Mendukung JPG, PNG, GIF, WebP, SVG, dan PDF.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`${collection}_url`}>atau URL Gambar / PDF</label>
              <input id={`${collection}_url`} className={inputClass} placeholder="https://..." value={newSlide.image_url} onChange={(e) => setNewSlide({ ...newSlide, image_url: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className={labelClass} htmlFor={`${collection}_pos`}>Urutan</label>
                <input id={`${collection}_pos`} type="number" className={inputClass} value={newSlide.position} onChange={(e) => setNewSlide({ ...newSlide, position: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass} htmlFor={`${collection}_type`}>Tipe Media</label>
                <select id={`${collection}_type`} className={inputClass} value={newSlide.media_type} onChange={(e) => setNewSlide({ ...newSlide, media_type: e.target.value })}>
                  <option value="auto">Otomatis (deteksi)</option>
                  <option value="image">Gambar</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
          </>
        )}

        {isText && (
          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor={`${collection}_pos_text`}>Urutan</label>
            <input id={`${collection}_pos_text`} type="number" className={inputClass} value={newSlide.position} onChange={(e) => setNewSlide({ ...newSlide, position: e.target.value })} />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[var(--m-primary)] px-5 py-2.5 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Plus className="h-4 w-4" strokeWidth={2} /> Tambah Slide
        </button>
      </form>

      <div className="flex min-h-0 min-w-0 flex-col border border-white/10 bg-white/[0.02] xl:h-[calc(100dvh-7rem)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/55">Daftar Slide</p>
            <p className="mt-0.5 text-sm text-white">{loaded ? `${slides.length} slide` : 'Memuat…'}</p>
          </div>
          <p className="hidden text-xs text-emerald-100/40 sm:block">Scroll area kartu · form kiri tetap</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {!loaded ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded bg-white/[0.05]" />
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-emerald-100/55">
              Belum ada slide. Tambahkan slide pertama dari form di kiri.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-2">
              {slides.map((slide) => (
                <SlideRow key={slide.id} slide={slide} onSave={updateSlide} onDelete={removeSlide} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SlideRow = ({ slide, onSave, onDelete }) => {
  const isText = slide.slide_type === 'text';
  const isYoutube = slide.slide_type === 'youtube';
  const isWebsite = slide.slide_type === 'website';
  const isVideo = !isText && !isYoutube && !isWebsite && isVideoSlide(slide);
  const [draft, setDraft] = useState({
    title: slide.title || '',
    caption: slide.caption || '',
    image_url: slide.image_url || '',
    video_url: slide.video_url || '',
    position: slide.position || 0,
    active: slide.active !== false,
    media_type: slide.media_type || 'auto',
    slide_type: slide.slide_type || 'image',
    text_content: slide.text_content || '',
    text_translation: slide.text_translation || '',
    text_font_size: slide.text_font_size || 'lg',
    text_color: slide.text_color || '#ecfdf5',
    text_bg: slide.text_bg || '#0d2019',
    text_align: slide.text_align || 'center',
    website_url: slide.website_url || '',
    youtube_url: slide.youtube_url || '',
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const preview = isText || isVideo || isYoutube || isWebsite ? null : slideImage(slide);
  const videoPreview = isVideo ? slideVideo(slide) : null;
  const type = isText ? 'image' : slideMediaType(slide);

  const save = async () => {
    setBusy(true);
    const fileField = isVideo ? 'video' : 'image';
    await onSave(slide, draft, (isText || isYoutube || isWebsite) ? null : file, fileField);
    setFile(null);
    setBusy(false);
  };

  return (
    <div className="flex h-full flex-col gap-3 border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      {/* Large media preview */}
      <div className="relative overflow-hidden border border-white/10 bg-black/40">
        <div className="aspect-video w-full">
          {isText ? (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
              style={{
                background: draft.text_bg || '#0d2019',
                color: draft.text_color || '#ecfdf5',
                textAlign: draft.text_align || 'center',
              }}
            >
              <p className="line-clamp-3 font-display text-base leading-snug sm:text-lg">
                {draft.text_content || 'Teks / ayat'}
              </p>
              {draft.text_translation ? (
                <p className="line-clamp-2 text-xs opacity-75 sm:text-sm">{draft.text_translation}</p>
              ) : null}
            </div>
          ) : isYoutube && draft.youtube_url && youtubeEmbedUrl(draft.youtube_url) ? (
            <iframe
              src={youtubeEmbedUrl(draft.youtube_url)}
              title={draft.title || 'YouTube'}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen"
            />
          ) : isWebsite && draft.website_url ? (
            <iframe
              src={draft.website_url}
              title={draft.title || 'Website'}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : isVideo && (file || videoPreview) ? (
            <video
              src={file ? URL.createObjectURL(file) : videoPreview}
              className="h-full w-full object-contain"
              controls
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : preview && type !== 'pdf' ? (
            <img
              src={file ? URL.createObjectURL(file) : preview}
              alt={slide.title || 'Preview slide'}
              className="h-full w-full object-cover"
            />
          ) : preview && type === 'pdf' ? (
            <iframe src={preview} title={slide.title || 'PDF'} className="h-full w-full border-0 bg-white" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-emerald-100/40">
              Tidak ada pratinjau
            </div>
          )}
        </div>
        <span className={`absolute left-2 top-2 inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] uppercase tracking-wider shadow-sm backdrop-blur-sm ${
          isText
            ? 'bg-[color-mix(in_srgb,var(--m-primary)_35%,#04100c)] text-[var(--m-primary)]'
            : 'bg-black/65 text-emerald-50'
        }`}>
          {isText ? <><Type className="h-3 w-3" /> Teks</> : isVideo ? <><Video className="h-3 w-3" /> Video</> : isYoutube ? <><Youtube className="h-3 w-3" /> YouTube</> : isWebsite ? <><Globe className="h-3 w-3" /> Website</> : <><FileText className="h-3 w-3" /> {type === 'pdf' ? 'PDF' : 'Gambar'}</>}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className={labelClass}>Judul</span>
          <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>
        {isText ? (
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Sumber / Label</span>
            <input className={inputClass} value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Keterangan</span>
            <input className={inputClass} value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
          </div>
        )}
      </div>

      {isText ? (
        <>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Teks Utama</span>
            <textarea rows={2} className={`${inputClass} font-display text-sm`} value={draft.text_content} onChange={(e) => setDraft({ ...draft, text_content: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Terjemahan</span>
            <textarea rows={2} className={`${inputClass} text-sm`} value={draft.text_translation} onChange={(e) => setDraft({ ...draft, text_translation: e.target.value })} />
          </div>
          <div className="grid gap-2 grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Ukuran Font</span>
              <select className={inputClass} value={draft.text_font_size} onChange={(e) => setDraft({ ...draft, text_font_size: e.target.value })}>
                {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Rata Teks</span>
              <select className={inputClass} value={draft.text_align} onChange={(e) => setDraft({ ...draft, text_align: e.target.value })}>
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Warna Teks</span>
              <div className="flex items-center gap-1">
                <input type="color" className="h-9 w-10 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                  value={/^#[0-9a-fA-F]{6}$/.test(draft.text_color) ? draft.text_color : '#ecfdf5'}
                  onChange={(e) => setDraft({ ...draft, text_color: e.target.value })} />
                <input className={`${inputClass} text-xs`} value={draft.text_color} onChange={(e) => setDraft({ ...draft, text_color: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Warna Latar</span>
              <div className="flex items-center gap-1">
                <input type="color" className="h-9 w-10 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                  value={/^#[0-9a-fA-F]{6}$/.test(draft.text_bg) ? draft.text_bg : '#0d2019'}
                  onChange={(e) => setDraft({ ...draft, text_bg: e.target.value })} />
                <input className={`${inputClass} text-xs`} value={draft.text_bg} onChange={(e) => setDraft({ ...draft, text_bg: e.target.value })} />
              </div>
            </div>
          </div>
        </>
      ) : isYoutube ? (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>URL / ID YouTube</span>
          <input className={inputClass} placeholder="https://youtu.be/xxxx atau ID" value={draft.youtube_url} onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })} />
        </div>
      ) : isWebsite ? (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>URL Website</span>
          <input className={inputClass} placeholder="https://example.com" value={draft.website_url} onChange={(e) => setDraft({ ...draft, website_url: e.target.value })} />
        </div>
      ) : isVideo ? (
        <div className="grid gap-2">
          <input className={inputClass} placeholder="URL video (mp4/webm/ogg)" value={draft.video_url} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} />
          <input type="file" accept="video/*" className={inputClass} onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>
      ) : (
        <div className="grid gap-2">
          <input className={inputClass} placeholder="URL gambar / PDF" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
          <input type="file" accept="image/*,application/pdf" className={inputClass} onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <label className="flex items-center gap-1.5 text-xs text-emerald-100/70">
          Urutan
          <input type="number" className="w-16 border border-white/15 bg-white/[0.04] px-2 py-1 text-white outline-none focus:border-[var(--m-primary)]"
            value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
        </label>
        {!isText && !isVideo && !isYoutube && !isWebsite && (
          <select
            className="border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none focus:border-[var(--m-primary)]"
            value={draft.media_type}
            onChange={(e) => setDraft({ ...draft, media_type: e.target.value })}
          >
            <option value="auto">Otomatis</option>
            <option value="image">Gambar</option>
            <option value="pdf">PDF</option>
          </select>
        )}
        <label className="flex items-center gap-1.5 text-xs text-emerald-100/70">
          <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
          Tampilkan
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-[color-mix(in_srgb,var(--m-primary)_60%,transparent)] px-3 py-1.5 text-xs text-[var(--m-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--m-primary)_10%,transparent)] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={2} />} Simpan
          </button>
          <button
            type="button"
            onClick={() => onDelete(slide.id)}
            className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-xs text-emerald-100/60 transition-colors hover:border-red-400/60 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideManager;
