import pb from "@/lib/pocketbaseClient";
import apiServerClient from "@/lib/apiServerClient";
import { getDbSource, DB_SUPABASE } from "@/lib/dbSource";
import supabase from "@/lib/supabaseClient";
import {
  fetchSettingsSupa,
  fetchSlidesSupa,
  fetchDashboardSlidesSupa,
  fetchBioSupa,
  fetchBioLinksSupa,
  fetchActivitiesSupa,
  subscribeSupabase,
} from "@/lib/supabaseDb";

export const TZ = "Asia/Jakarta";

/**
 * True when the app should read from Supabase (toggle on AND client wired up).
 * When Supabase is selected but not yet configured, we gracefully fall back
 * to PocketBase so the app never breaks during setup.
 */
function shouldUseSupabase() {
  return getDbSource() === DB_SUPABASE && supabase != null;
}

const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const BULAN_HIJRI = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

/** Convert Gregorian date to Hijri date using the built-in Intl Islamic calendar. */
function gregorianToHijri(date = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = {};
    fmt.formatToParts(date).forEach((p) => {
      parts[p.type] = p.value;
    });
    return {
      day: Number(parts.day),
      month: Number(parts.month),
      year: Number(parts.year),
    };
  } catch (e) {
    return { day: 1, month: 1, year: 1448 };
  }
}

/** Returns the current Asia/Jakarta wall-clock parts. */
export function jakartaParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = {};
  fmt.formatToParts(date).forEach((p) => {
    parts[p.type] = p.value;
  });

  const hour = parts.hour === "24" ? "00" : parts.hour;
  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  const weekdayIndex = new Date(`${isoDate}T00:00:00Z`).getUTCDay();

  // Calculate Hijri date from the Jakarta-local calendar date (avoids UTC off-by-one)
  const hijri = gregorianToHijri(new Date(`${isoDate}T00:00:00Z`));
  const hijriDate = `${hijri.day} ${BULAN_HIJRI[hijri.month - 1]} ${hijri.year}H`;

  return {
    isoDate,
    hour,
    minute: parts.minute,
    second: parts.second,
    minutesOfDay: Number(hour) * 60 + Number(parts.minute),
    longDate: `${HARI[weekdayIndex]}, ${Number(parts.day)} ${BULAN[Number(parts.month) - 1]} ${parts.year}`,
    hijriDate,
  };
}

export const PRAYER_KEYS = [
  { key: "imsak", label: "Imsak" },
  { key: "subuh", label: "Subuh" },
  { key: "terbit", label: "Syuruq" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

export function toMinutes(hhmm) {
  if (typeof hhmm !== "string" || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Next upcoming prayer (skipping imsak/terbit) plus countdown string. */
export function nextPrayer(jadwal, minutesOfDay) {
  if (!jadwal) return null;

  const schedule = [
    { key: "subuh", label: "Subuh" },
    { key: "dzuhur", label: "Dzuhur" },
    { key: "ashar", label: "Ashar" },
    { key: "maghrib", label: "Maghrib" },
    { key: "isya", label: "Isya" },
  ]
    .map((p) => ({ ...p, minutes: toMinutes(jadwal[p.key]) }))
    .filter((p) => p.minutes !== null);

  const upcoming =
    schedule.find((p) => p.minutes > minutesOfDay) || schedule[0];
  if (!upcoming) return null;

  let diff = upcoming.minutes - minutesOfDay;
  if (diff < 0) diff += 24 * 60;

  return {
    ...upcoming,
    time: jadwal[upcoming.key],
    countdown: `${String(Math.floor(diff / 60)).padStart(2, "0")} jam ${String(diff % 60).padStart(2, "0")} menit`,
  };
}

export const SCHEDULE_DEFAULTS = {
  sched_before_prayer: 5,
  sched_after_prayer: 10,
  sched_interval_hours: 1,
  sched_enabled: true,
};

export function scheduleConfig(settings) {
  return {
    before: Number(
      (settings && settings.sched_before_prayer) ||
        SCHEDULE_DEFAULTS.sched_before_prayer,
    ),
    after: Number(
      (settings && settings.sched_after_prayer) ||
        SCHEDULE_DEFAULTS.sched_after_prayer,
    ),
    interval: Number(
      (settings && settings.sched_interval_hours) ||
        SCHEDULE_DEFAULTS.sched_interval_hours,
    ),
    enabled: settings ? settings.sched_enabled !== false : true,
  };
}

/**
 * Decide which slide collection should be shown right now.
 * Returns { source: 'dashboard'|'info', reason: string }
 */
export function activeSlideSource(jadwal, minutesOfDay, settings) {
  const cfg = scheduleConfig(settings);
  if (!cfg.enabled)
    return { source: "dashboard", reason: "Penjadwalan nonaktif" };

  if (jadwal) {
    const times = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
      .map((k) => ({ key: k, minutes: toMinutes(jadwal[k]) }))
      .filter((p) => p.minutes !== null);

    for (const p of times) {
      if (minutesOfDay >= p.minutes - cfg.before && minutesOfDay < p.minutes) {
        return {
          source: "dashboard",
          reason: `${cfg.before} menit sebelum ${p.key}`,
        };
      }
      if (minutesOfDay >= p.minutes && minutesOfDay <= p.minutes + cfg.after) {
        return {
          source: "info",
          reason: `${cfg.after} menit setelah ${p.key}`,
        };
      }
    }
  }

  const block = Math.floor(minutesOfDay / (Math.max(1, cfg.interval) * 60));
  return {
    source: block % 2 === 0 ? "dashboard" : "info",
    reason: `Rotasi otomatis tiap ${cfg.interval} jam`,
  };
}

export async function fetchJadwal(cityId, isoDate) {
  const res = await apiServerClient.fetch(
    `/sholat/jadwal?city=${encodeURIComponent(cityId)}&date=${isoDate}`,
  );
  if (!res.ok) throw new Error("Gagal memuat jadwal sholat");
  return res.json();
}

export async function fetchKota() {
  const res = await apiServerClient.fetch("/sholat/kota");
  if (!res.ok) throw new Error("Gagal memuat daftar kota");
  return res.json();
}

/**
 * True when an error is the PocketBase SDK auto-cancellation (request aborted
 * because a newer duplicate request superseded it). These are expected and
 * must NOT be surfaced to the user as errors.
 */
export function isAbortError(err) {
  if (!err) return false;
  const status = err.status ?? err.code;
  if (status === 0) return true;
  const msg = String(err.message || err.originalError?.message || "");
  return /aborted|autocancel|signal is aborted/i.test(msg);
}

/**
 * Fetch the single settings record.
 * Pass a unique `requestKey` so concurrent callers (PWA manifest hook,
 * dashboard data hook, admin panel) don't share the SDK default key and
 * auto-cancel each other. Omit it to disable auto-cancellation for this read.
 */
export async function fetchSettings(opts = {}) {
  if (shouldUseSupabase() && !opts.forcePocketBase) return fetchSettingsSupa();
  const list = await pb.collection("settings").getList(1, 1, {
    sort: "created",
    requestKey: opts.requestKey ?? null,
  });
  return list.items[0] || null;
}

export async function fetchSlides(opts = {}) {
  if (shouldUseSupabase() && !opts.forcePocketBase) return fetchSlidesSupa();
  return pb.collection("slides").getFullList({
    sort: "position,created",
    requestKey: opts.requestKey ?? null,
  });
}

export async function fetchDashboardSlides(opts = {}) {
  if (shouldUseSupabase() && !opts.forcePocketBase)
    return fetchDashboardSlidesSupa();
  return pb.collection("dashboard_slides").getFullList({
    sort: "position,created",
    requestKey: opts.requestKey ?? null,
  });
}

/**
 * Fetch the single bio record (public read).
 * Pass a unique `requestKey` so concurrent callers don't auto-cancel each other.
 */
export async function fetchBio(opts = {}) {
  if (shouldUseSupabase() && !opts.forcePocketBase) return fetchBioSupa();
  const list = await pb.collection("bio").getList(1, 1, {
    sort: "created",
    requestKey: opts.requestKey ?? null,
  });
  return list.items[0] || null;
}

/**
 * Fetch all bio link buttons (public read), sorted by position.
 * Pass a unique `requestKey` so concurrent callers don't auto-cancel each other.
 */
export async function fetchBioLinks(opts = {}) {
  if (shouldUseSupabase() && !opts.forcePocketBase) return fetchBioLinksSupa();
  return pb.collection("bio_links").getFullList({
    sort: "position,created",
    requestKey: opts.requestKey ?? null,
  });
}

/**
 * Fetch all activities (public read), sorted by position.
 * Pass a unique `requestKey` so concurrent callers don't auto-cancel each other.
 */
export async function fetchActivities(opts = {}) {
  if (shouldUseSupabase() && !opts.forcePocketBase)
    return fetchActivitiesSupa();
  return pb.collection("activities").getFullList({
    sort: "position,created",
    requestKey: opts.requestKey ?? null,
  });
}

export function fileUrl(record, filename) {
  if (!record || !filename) return "";
  if (typeof filename !== "string") return "";
  // Supabase rows store file columns as ready-to-use URL strings (the sync
  // hook writes the full PocketBase file URL there). Pass them through.
  if (/^(https?:)?\/\//.test(filename)) return filename;
  // Check for /pb prefix or direct /api/files path
  if (filename.startsWith("/pb/") || filename.startsWith("/api/files/"))
    return filename;
  // PocketBase record: filename is a bare token — resolve via the SDK.
  return pb.files.getURL(record, filename);
}

/**
 * Source-aware realtime subscription for a collection/table.
 * Returns an unsubscribe function. `onChange()` fires (no payload) on any
 * create/update/delete so the caller can refetch. Routes to Supabase
 * postgres_changes when Supabase is active, otherwise PocketBase realtime.
 */
export function subscribeCollection(collection, onChange) {
  if (shouldUseSupabase()) {
    return subscribeSupabase(collection, onChange);
  }
  let unsub = null;
  const p = pb
    .collection(collection)
    .subscribe("*", () => {
      try {
        onChange();
      } catch (_) {
        /* best-effort */
      }
    })
    .then((fn) => {
      unsub = fn;
    })
    .catch(() => {});
  return () => {
    try {
      if (unsub) unsub();
    } catch (_) {
      /* noop */
    }
    void p.catch(() => {});
    void pb
      .collection(collection)
      .unsubscribe("*")
      .catch(() => {});
  };
}

export function slideImage(slide) {
  return slide.image ? fileUrl(slide, slide.image) : slide.image_url || "";
}

/** Resolve the video URL for a slide (uploaded file or external URL). */
export function slideVideo(slide) {
  if (slide.video && typeof slide.video === "string")
    return fileUrl(slide, slide.video);
  return slide.video_url || "";
}

export const THEME_DEFAULTS = {
  theme_bg: "#04100c",
  theme_surface: "#0d2019",
  theme_primary: "#c9a227",
  theme_text: "#ecfdf5",
  theme_iqomah: "#22c55e",
};

/** Format number with Indonesian thousand separators (1.000.000). */
export function formatIdr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = String(Math.abs(rounded));
  return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function themeColors(settings) {
  return {
    bg: (settings && settings.theme_bg) || THEME_DEFAULTS.theme_bg,
    surface:
      (settings && settings.theme_surface) || THEME_DEFAULTS.theme_surface,
    primary:
      (settings && settings.theme_primary) || THEME_DEFAULTS.theme_primary,
    text: (settings && settings.theme_text) || THEME_DEFAULTS.theme_text,
    iqomah: (settings && settings.theme_iqomah) || THEME_DEFAULTS.theme_iqomah,
  };
}

export function applyTheme(settings) {
  const c = themeColors(settings);
  const root = document.documentElement;
  root.style.setProperty("--m-bg", c.bg);
  root.style.setProperty("--m-surface", c.surface);
  root.style.setProperty("--m-primary", c.primary);
  root.style.setProperty("--m-text", c.text);
  root.style.setProperty("--m-iqomah", c.iqomah);
}

/** Detect whether a slide is a PDF, an image, or a video. */
export function slideMediaType(slide) {
  if (slide.media_type && slide.media_type !== "auto") return slide.media_type;
  const file =
    slide.image && typeof slide.image === "string" ? slide.image : "";
  if (/\.pdf$/i.test(file)) return "pdf";
  const src = slideImage(slide);
  if (/\.pdf(\?|$)/i.test(src)) return "pdf";
  return "image";
}

/**
 * Extract a YouTube video ID from a URL or bare ID string.
 * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, bare ID (11 chars).
 */
export function youtubeVideoId(urlOrId) {
  if (!urlOrId) return null;
  const s = String(urlOrId).trim();
  // youtu.be short link
  const short = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return short[1];
  // standard watch or embed
  const long = s.match(/[?&/](?:v=|embed\/)([A-Za-z0-9_-]{11})/);
  if (long) return long[1];
  // bare 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

/**
 * Build an auto-play, looping, muted YouTube embed URL for iframe use.
 */
export function youtubeEmbedUrl(urlOrId) {
  const id = youtubeVideoId(urlOrId);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1`;
}

/** Detect whether a slide is a video by extension/mime of the uploaded file or URL. */
export function isVideoSlide(slide) {
  if (slide.slide_type === "video") return true;
  const file =
    slide.video && typeof slide.video === "string" ? slide.video : "";
  if (/\.(mp4|webm|ogg|ogv|mov|mkv|avi)$/i.test(file)) return true;
  const url = slide.video_url || "";
  if (/\.(mp4|webm|ogg|ogv|mov|mkv|avi)(\?|$)/i.test(url)) return true;
  return false;
}
