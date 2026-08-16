import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, ImageOff, Video } from 'lucide-react';
import { slideImage, slideMediaType, slideVideo, isVideoSlide, youtubeVideoId } from '@/lib/masjid';
import YouTubeSlide from '@/components/masjid/YouTubeSlide';

const FONT_SIZE_MAP = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-4xl',
  lg: 'text-3xl md:text-5xl',
  xl: 'text-4xl md:text-6xl',
  '2xl': 'text-5xl md:text-7xl',
};

const ALIGN_MAP = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

const TextSlide = ({ slide }) => {
  const align = slide.text_align || 'center';
  const fontSize = FONT_SIZE_MAP[slide.text_font_size] || FONT_SIZE_MAP.lg;
  const textColor = slide.text_color || '#ecfdf5';
  const bg = slide.text_bg || slide.text_background_color || 'var(--m-surface)';
  const alignClasses = ALIGN_MAP[align] || ALIGN_MAP.center;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center overflow-auto px-6 py-10 md:px-16 lg:px-24"
      style={{ background: bg }}
    >
      <div className={`mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-6 ${alignClasses}`}>
        {slide.text_content && (
          <p className={`font-display leading-snug ${fontSize}`} style={{ color: textColor }}>
            {slide.text_content}
          </p>
        )}
        {slide.text_translation && (
          <p
            className="max-w-4xl text-base leading-relaxed md:text-xl lg:text-2xl"
            style={{ color: textColor, opacity: 0.75 }}
          >
            {slide.text_translation}
          </p>
        )}
        {slide.caption && (
          <p className="mt-2 text-sm uppercase tracking-widest md:text-base" style={{ color: 'var(--m-primary)' }}>
            {slide.caption}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * @param {object} props
 * @param {Array} props.slides
 * @param {number} [props.seconds]
 * @param {'contain'|'cover'} [props.fillMode] - cover fills edges (info screen); contain keeps full image (dashboard)
 * @param {boolean} [props.showCaption]
 * @param {(index: number) => void} [props.onIndexChange]
 * @param {(playing: boolean) => void} [props.onVideoStateChange] - notifies parent when a video slide is playing
 */
const SlideShow = ({ slides, seconds = 8, fillMode = 'contain', showCaption = true, onIndexChange, onVideoStateChange }) => {
  const [index, setIndex] = useState(0);
  const [videoDur, setVideoDur] = useState(null);
  const items = slides || [];

  const onIndexChangeRef = useRef(onIndexChange);
  const onVideoStateChangeRef = useRef(onVideoStateChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
    onVideoStateChangeRef.current = onVideoStateChange;
  }, [onIndexChange, onVideoStateChange]);

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [index, items.length]);

  useEffect(() => {
    if (typeof onIndexChangeRef.current === 'function') onIndexChangeRef.current(index);
  }, [index]);

  const current = items.length ? items[Math.min(index, items.length - 1)] : null;
  const isText = current && current.slide_type === 'text';
  const isYoutube = !!current && current.slide_type === 'youtube';
  const isWebsite = !!current && current.slide_type === 'website';
  const isVideo = !!current && !isText && !isYoutube && !isWebsite && isVideoSlide(current);

  // Reset measured duration whenever the active slide changes.
  useEffect(() => {
    setVideoDur(null);
  }, [current && current.id]);

  // Notify parent of video/iframe play state (used to defer scheduling switches).
  useEffect(() => {
    const fn = onVideoStateChangeRef.current;
    if (typeof fn === 'function') fn(isVideo || isYoutube || isWebsite);
    return () => {
      if ((isVideo || isYoutube || isWebsite) && typeof fn === 'function') fn(false);
    };
  }, [isVideo, isYoutube, isWebsite]);

  // Advance logic:
  // - YouTube: advance only when the video ends / live stream stops (YouTubeSlide)
  // - Website: advance after the configured interval
  // - Video: wait for playback to finish (or loop until interval elapses for short clips)
  // - Image/Text: fixed interval
  useEffect(() => {
    if (items.length < 2 || !current) return undefined;

    if (isWebsite) {
      // Website iframe slides: display for `seconds` then advance.
      const id = setTimeout(() => {
        const fn = onVideoStateChangeRef.current;
        if (typeof fn === 'function') fn(false);
        setIndex((i) => (i + 1) % items.length);
      }, Math.max(3, seconds) * 1000);
      return () => clearTimeout(id);
    }

    if (isYoutube) {
      // YouTube slides advance only when the video ends / live stream stops
      // (handled by YouTubeSlide via onEnded). No fixed timer here.
      return undefined;
    }

    if (isVideo) {
      // Short clip: loop it and advance once the normal interval has elapsed.
      if (videoDur != null && videoDur < seconds) {
        const id = setTimeout(() => setIndex((i) => (i + 1) % items.length), Math.max(3, seconds) * 1000);
        return () => clearTimeout(id);
      }
      // Clip at least as long as the interval: advance on `ended` (handled below).
      return undefined;
    }

    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), Math.max(3, seconds) * 1000);
    return () => clearInterval(id);
  }, [items.length, seconds, isVideo, isYoutube, isWebsite, videoDur, current && current.id]);

  const advance = () => setIndex((i) => (i + 1) % items.length);

  const handleVideoEnded = () => {
    // Looping short clips are advanced by the timeout above.
    if (videoDur != null && videoDur < seconds) return;
    const fn = onVideoStateChangeRef.current;
    if (typeof fn === 'function') fn(false);
    advance();
  };

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--m-bg)] text-emerald-100/50">
        <ImageOff className="h-8 w-8" strokeWidth={1.5} />
        <p className="text-sm">Belum ada slide.</p>
      </div>
    );
  }

  const src = isText || isVideo ? null : slideImage(current);
  const videoSrc = isVideo ? slideVideo(current) : null;
  const type = isText ? 'image' : slideMediaType(current);
  const objectClass = fillMode === 'cover' ? 'object-cover' : 'object-contain';
  const loopShort = isVideo && videoDur != null && videoDur < seconds;

  return (
    <div className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden bg-[var(--m-bg)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isText ? (
            <TextSlide slide={current} />
          ) : isYoutube && current.youtube_url && youtubeVideoId(current.youtube_url) ? (
            <YouTubeSlide
              key={current.id}
              videoId={youtubeVideoId(current.youtube_url)}
              onEnded={advance}
              onPlayingChange={(playing) => {
                const fn = onVideoStateChangeRef.current;
                if (typeof fn === 'function') fn(playing);
              }}
            />
          ) : isWebsite && current.website_url ? (
            <iframe
              key={current.id}
              src={current.website_url}
              title={current.title || 'Website'}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allowFullScreen
            />
          ) : isVideo && videoSrc ? (
            <video
              src={videoSrc}
              title={current.title || 'Video masjid'}
              className={`h-full w-full bg-black ${objectClass}`}
              autoPlay
              loop={loopShort}
              muted
              playsInline
              controls={false}
              preload="auto"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) setVideoDur(d);
              }}
              onEnded={handleVideoEnded}
            />
          ) : src && type === 'pdf' ? (
            <iframe
              src={src}
              title={current.title || 'Informasi masjid'}
              className="h-full w-full border-0 bg-white"
            />
          ) : src ? (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--m-bg)]">
              {fillMode === 'contain' && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
                  style={{ backgroundImage: `url("${src}")` }}
                />
              )}
              <img
                src={src}
                alt={current.title || 'Informasi masjid'}
                className={`relative z-[1] h-full w-full ${objectClass}`}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald-950 text-emerald-100/40">
              {isVideo ? <Video className="h-10 w-10" strokeWidth={1.5} /> : <FileText className="h-10 w-10" strokeWidth={1.5} />}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {showCaption && !isText && (current.title || current.caption) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="bg-gradient-to-t from-[var(--m-bg)] via-[color-mix(in_srgb,var(--m-bg)_78%,transparent)] to-transparent px-5 pb-14 pt-10 md:px-10 md:pb-16 md:pt-14">
            {current.title && (
              <>
                <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-[var(--m-primary)] md:text-xs">Informasi</p>
                <h3 className="font-display text-xl leading-tight text-white sm:text-2xl md:text-4xl">{current.title}</h3>
              </>
            )}
            {current.caption && (
              <p className="mt-1.5 max-w-4xl text-xs leading-snug text-emerald-50/85 sm:text-sm md:text-lg">{current.caption}</p>
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-3">
        <div className="flex gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm">
          {items.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-[var(--m-primary)]' : 'w-3 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlideShow;
