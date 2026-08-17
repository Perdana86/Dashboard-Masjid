import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Images,
  Info,
  MapPin,
  Settings2,
  Maximize2,
  Minimize2,
  CalendarDays,
} from "lucide-react";
import LiveClock, { useJakartaClock } from "@/components/masjid/LiveClock";
import Marquee from "@/components/masjid/Marquee";
import SlideShow from "@/components/masjid/SlideShow";
import useMasjidData from "@/hooks/useMasjidData";
import useTheme from "@/hooks/useTheme";
import useFavicon from "@/hooks/useFavicon";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import PrayerNotification from "@/components/masjid/PrayerNotification";
import {
  PRAYER_KEYS,
  activeSlideSource,
  fileUrl,
  formatIdr,
  nextPrayer,
  toMinutes,
} from "@/lib/masjid";

const DashboardPage = () => {
  const now = useJakartaClock();
  const { settings, slides, dashboardSlides, prayer, loading, error } =
    useMasjidData();
  useTheme(settings);
  useFavicon(settings);
  const { active: notifActive, dismiss: dismissNotif } = usePrayerNotifications(
    prayer && prayer.jadwal,
    now,
    "dashboard",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const jadwal = prayer && prayer.jadwal;
  const upcoming = nextPrayer(jadwal, now.minutesOfDay);
  const schedule = activeSlideSource(jadwal, now.minutesOfDay, settings);

  // Defer scheduling source-switches while a video slide is playing so the
  // video finishes before the dashboard/info collection changes.
  const videoPlayingRef = useRef(false);
  const pendingSourceRef = useRef(null);
  const [displayedSource, setDisplayedSource] = useState(schedule.source);

  React.useEffect(() => {
    const desired = schedule.source;
    if (desired === displayedSource) {
      pendingSourceRef.current = null;
      return;
    }
    if (videoPlayingRef.current) {
      pendingSourceRef.current = desired;
    } else {
      pendingSourceRef.current = null;
      setDisplayedSource(desired);
    }
  }, [schedule.source, displayedSource]);

  const handleVideoStateChange = React.useCallback((playing) => {
    videoPlayingRef.current = playing;
    if (!playing && pendingSourceRef.current) {
      const next = pendingSourceRef.current;
      pendingSourceRef.current = null;
      setDisplayedSource(next);
    }
  }, []);

  const activeSlides = displayedSource === "info" ? slides : dashboardSlides;
  const logo =
    settings && settings.logo ? fileUrl(settings, settings.logo) : "";

  return (
    <div className="min-h-[100dvh] bg-[var(--m-bg)] text-emerald-50">
      <Helmet>
        <title>Masjid Al-Amanah</title>
        <meta
          name="description"
          content="Dashboard masjid dengan jadwal sholat otomatis, jam digital waktu Asia/Jakarta, slide informasi kegiatan, dan running teks pengumuman jamaah."
        />
      </Helmet>

      <PrayerNotification
        active={notifActive}
        onDismiss={dismissNotif}
        variant="dashboard"
      />

      <div className="masjid-pattern flex min-h-[100dvh] flex-col">
        <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:px-10">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex items-center gap-4">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo masjid"
                  className="h-14 w-14 rounded-full object-cover ring-1 ring-[color-mix(in_srgb,var(--m-primary)_60%,transparent)]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--m-primary)_50%,transparent)] font-display text-2xl text-[var(--m-primary)]">
                  &#9770;
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl leading-tight text-white md:text-3xl">
                  {(settings && settings.mosque_name) || "Masjid Al-Amanah"}
                </h1>
                <p className="text-sm text-emerald-100/60">
                  {(settings && settings.tagline) ||
                    "Jadwal sholat & informasi jamaah"}
                </p>
              </div>
            </div>

            <LiveClock
              now={now}
              className="self-center text-6xl font-semibold text-white md:text-8xl lg:self-auto"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-emerald-100/70">
                <MapPin
                  className="h-4 w-4 text-[var(--m-primary)]"
                  strokeWidth={1.75}
                />
                <span>
                  {prayer
                    ? `${prayer.lokasi} — ${prayer.daerah}`
                    : (settings && settings.city_name) ||
                      "Menentukan lokasi..."}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <p className="text-emerald-100/70">{now.longDate}</p>
                <p className="font-medium text-[var(--m-primary)]">
                  {now.hijriDate}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 px-6 py-6 md:px-10 lg:grid-cols-[1.05fr_1fr] items-center">
          <section className="flex flex-col gap-4 md:gap-5 pt-1 md:pt-2">
            {error ? (
              <div className="flex items-start gap-3 border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4" strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            ) : null}

            {settings && settings.saldo_visible !== false ? (
              <div className="border border-[color-mix(in_srgb,var(--m-primary)_25%,transparent)] bg-[var(--m-surface)]/80 px-4 py-3 md:px-5 md:py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--m-primary)] md:text-xs">
                  {(settings && settings.saldo_label) || "Saldo Perpekan Jumat"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/50 md:text-xs">
                      {(settings && settings.label_sisa) || "Sisa Saldo"}
                    </p>
                    <p className="font-num truncate text-lg leading-tight text-sky-300 md:text-2xl lg:text-3xl">
                      {formatIdr(Number(settings.saldo_sisa || 0))}
                    </p>
                  </div>
                  <div className="min-w-0 border-x border-white/10 px-2 md:px-4">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/50 md:text-xs">
                      {(settings && settings.label_penerimaan) || "Penerimaan"}
                    </p>
                    <p className="font-num truncate text-lg leading-tight text-emerald-300 md:text-2xl lg:text-3xl">
                      {formatIdr(settings.saldo_pemasukan)}
                    </p>
                  </div>
                  <div className="min-w-0 md:border-x md:border-white/10 md:px-4">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/50 md:text-xs">
                      {(settings && settings.label_pengeluaran) ||
                        "Pengeluaran"}
                    </p>
                    <p className="font-num truncate text-lg leading-tight text-rose-300 md:text-2xl lg:text-3xl">
                      {formatIdr(settings.saldo_pengeluaran)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/50 md:text-xs">
                      {(settings && settings.label_kas) || "Saldo Kas"}
                    </p>
                    <p className="font-num truncate text-lg leading-tight text-[var(--m-primary)] md:text-2xl lg:text-3xl">
                      {formatIdr(Number(settings.saldo_kas || 0))}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="border border-[color-mix(in_srgb,var(--m-primary)_30%,transparent)] bg-gradient-to-br from-[var(--m-surface)] to-[var(--m-bg)] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--m-primary)]">
                Menuju waktu
              </p>
              {loading ? (
                <div className="mt-4 h-16 w-2/3 animate-pulse rounded bg-white/10" />
              ) : upcoming ? (
                <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-4xl text-white md:text-5xl">
                      {upcoming.label}
                    </p>
                    <p className="mt-1 text-emerald-100/70">
                      {upcoming.countdown} lagi
                    </p>
                  </div>
                  <p className="font-num text-6xl leading-none text-[var(--m-primary)] md:text-7xl">
                    {upcoming.time}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-emerald-100/60">
                  Jadwal belum tersedia.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {PRAYER_KEYS.map((p, i) => {
                const value = jadwal ? jadwal[p.key] : null;
                const isNext = upcoming && upcoming.key === p.key;
                const passed = value && toMinutes(value) <= now.minutesOfDay;

                return (
                  <motion.div
                    key={p.key}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: i * 0.04,
                      ease: "easeOut",
                    }}
                    className={`border p-4 transition-colors ${
                      isNext
                        ? "border-[var(--m-primary)] bg-[color-mix(in_srgb,var(--m-primary)_15%,transparent)]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${isNext ? "text-[var(--m-primary)]" : "text-emerald-100/55"}`}
                    >
                      {p.label}
                    </p>
                    <p
                      className={`font-num text-3xl ${passed && !isNext ? "text-emerald-100/45" : "text-white"}`}
                    >
                      {value || (loading ? "--:--" : "—")}
                    </p>
                  </motion.div>
                );
              })}

              {/* Iqomah: 10 menit setelah adzan sholat fardhu terdekat */}
              {(() => {
                const IQOMAH_OFFSET = 10;
                const fardhu = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];
                let baseMin = null;
                let iqomahActive = false;

                if (jadwal) {
                  // Jika masih dalam jendela 10 menit setelah adzan, pakai sholat itu
                  for (const key of fardhu) {
                    const m = toMinutes(jadwal[key]);
                    if (m === null) continue;
                    if (
                      now.minutesOfDay >= m &&
                      now.minutesOfDay < m + IQOMAH_OFFSET
                    ) {
                      baseMin = m;
                      iqomahActive = true;
                      break;
                    }
                  }
                  // Jika tidak, iqomah mengikuti sholat berikutnya
                  if (baseMin === null && upcoming && upcoming.time) {
                    baseMin = toMinutes(upcoming.time);
                  }
                }

                let iqomahTime = null;
                if (baseMin !== null) {
                  const total = (baseMin + IQOMAH_OFFSET) % (24 * 60);
                  iqomahTime = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                }

                return (
                  <motion.div
                    key="iqomah"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: PRAYER_KEYS.length * 0.04,
                      ease: "easeOut",
                    }}
                    className="border p-4 transition-colors"
                    style={
                      iqomahActive
                        ? {
                            borderColor: "var(--m-iqomah)",
                            background:
                              "color-mix(in srgb, var(--m-iqomah) 15%, transparent)",
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.03)",
                          }
                    }
                  >
                    <p
                      className="text-xs uppercase tracking-[0.2em]"
                      style={{
                        color: iqomahActive
                          ? "var(--m-iqomah)"
                          : "rgba(209,250,229,0.55)",
                      }}
                    >
                      Iqomah
                    </p>
                    <p className="font-num text-3xl text-white">
                      {iqomahTime || (loading ? "--:--" : "—")}
                    </p>
                  </motion.div>
                );
              })()}
            </div>

            {settings && settings.quote ? (
              <blockquote className="mt-2 border-l-2 border-[var(--m-primary)] pl-5 md:mt-4">
                <p className="font-display text-xl text-emerald-50/90 md:text-2xl">
                  &ldquo;{settings.quote}&rdquo;
                </p>
                {settings.quote_source ? (
                  <footer className="mt-2 text-sm text-[var(--m-primary)]">
                    {settings.quote_source}
                  </footer>
                ) : null}
              </blockquote>
            ) : null}
          </section>

          <section className="flex h-full w-full items-center justify-center">
            <div
              className="relative w-full overflow-hidden border border-white/10 bg-[var(--m-bg)]"
              style={{ aspectRatio: "1920 / 1080", maxHeight: "100%" }}
            >
              <SlideShow
                slides={activeSlides}
                seconds={(settings && settings.slide_seconds) || 8}
                fillMode="cover"
                onVideoStateChange={handleVideoStateChange}
              />
              <span className="pointer-events-none absolute bottom-2 right-3 z-20 text-[10px] uppercase tracking-[0.2em] text-white/40">
                {displayedSource === "info"
                  ? "Slide Informasi"
                  : "Slide Dashboard"}{" "}
                &middot; {schedule.reason}
              </span>
            </div>
          </section>
        </main>

        <Marquee text={settings && settings.running_text} />

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-xs text-emerald-100/45 md:px-10">
          <span>
            {(settings && settings.address) || ""} &middot; &copy;{" "}
            {new Date().getFullYear()}{" "}
            {(settings && settings.mosque_name) || "Masjid Al-AManah"}
          </span>
          <span className="flex items-center gap-4">
            <button
              onClick={handleFullscreenToggle}
              className="inline-flex items-center gap-1 hover:text-[var(--m-primary)] transition-colors"
              title={
                isFullscreen ? "Keluar dari fullscreen" : "Masuk fullscreen"
              }
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.75} />{" "}
                  Keluar Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />{" "}
                  Fullscreen
                </>
              )}
            </button>
            <Link
              to="/informasi"
              className="inline-flex items-center gap-1 hover:text-[var(--m-primary)]"
            >
              <Images className="h-3.5 w-3.5" strokeWidth={1.75} /> Layar
              Informasi
            </Link>
            <Link
              to="/bio"
              className="inline-flex items-center gap-1 hover:text-[var(--m-primary)]"
            >
              <Info className="h-3.5 w-3.5" strokeWidth={1.75} /> Tentang Masjid
            </Link>
            <Link
              to="/activity"
              className="inline-flex items-center gap-1 hover:text-[var(--m-primary)]"
            >
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />{" "}
              Kegiatan
            </Link>
            <Link
              to="/admin"
              className="hidden inline-flex items-center gap-1 hover:text-[var(--m-primary)]"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Panel
              Admin
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
