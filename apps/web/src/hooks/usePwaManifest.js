import { useEffect, useRef } from "react";
import {
  fileUrl,
  fetchSettings,
  isAbortError,
  subscribeCollection,
} from "@/lib/masjid";

const DEFAULTS = {
  pwa_app_name: "Dashboard Masjid",
  pwa_short_name: "Masjid",
  pwa_description:
    "Dashboard masjid dengan jadwal sholat, iqomah, informasi saldo, dan slideshow informasi jamaah.",
  pwa_theme_color: "#011811",
  pwa_bg_color: "#011811",
};

const STATIC_ICONS = [
  {
    src: "/icons/icon-512.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512.png",
    sizes: "1024x1024",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/maskable-512.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "maskable",
  },
  {
    src: "/icons/maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
  {
    src: "/icons/maskable-512.png",
    sizes: "1024x1024",
    type: "image/png",
    purpose: "maskable",
  },
];

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

function upsertMeta(name, content) {
  let el = document.querySelector(`meta[name='${name}']`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setAppleTouchIcon(href) {
  let el = document.querySelector("link[rel='apple-touch-icon']");
  if (!el) {
    el = document.createElement("link");
    el.rel = "apple-touch-icon";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Builds and applies a dynamic PWA manifest from the masjid settings.
 * Call once (e.g. in App.jsx). It fetches the settings record on mount and
 * subscribes to realtime updates so admin edits sync to the installed app
 * immediately. Falls back to /manifest.json defaults when no settings exist.
 */
export default function usePwaManifest() {
  const blobUrlRef = useRef(null);

  useEffect(() => {
    const apply = (settings) => {
      const appName =
        (settings && settings.pwa_app_name) || DEFAULTS.pwa_app_name;
      const shortName =
        (settings && settings.pwa_short_name) || DEFAULTS.pwa_short_name;
      const description =
        (settings && settings.pwa_description) || DEFAULTS.pwa_description;
      const themeColor =
        (settings && settings.pwa_theme_color) || DEFAULTS.pwa_theme_color;
      const bgColor =
        (settings && settings.pwa_bg_color) || DEFAULTS.pwa_bg_color;
      const logoFile = settings && settings.pwa_logo ? settings.pwa_logo : "";
      const logoUrl = logoFile ? fileUrl(settings, logoFile) : "";

      // Build icon set: custom logo for all sizes, else static defaults.
      let icons;
      if (logoUrl) {
        const ext = String(logoFile).split(".").pop().toLowerCase();
        const type = MIME_BY_EXT[ext] || "image/png";
        icons = [
          { src: logoUrl, sizes: "192x192", type, purpose: "any" },
          { src: logoUrl, sizes: "512x512", type, purpose: "any" },
          { src: logoUrl, sizes: "1024x1024", type, purpose: "any" },
          { src: logoUrl, sizes: "192x192", type, purpose: "maskable" },
          { src: logoUrl, sizes: "512x512", type, purpose: "maskable" },
          { src: logoUrl, sizes: "1024x1024", type, purpose: "maskable" },
        ];
      } else {
        icons = STATIC_ICONS;
      }

      const manifest = {
        name: appName,
        short_name: shortName,
        description,
        lang: "id",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone", "minimal-ui"],
        orientation: "any",
        background_color: bgColor,
        theme_color: themeColor,
        categories: ["education", "lifestyle", "productivity"],
        icons,
      };

      // Replace the manifest link with a blob URL built from settings.
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      const blob = new Blob([JSON.stringify(manifest)], {
        type: "application/manifest+json",
      });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      let link = document.querySelector("link[rel='manifest']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "manifest";
        document.head.appendChild(link);
      }
      link.href = url;

      // Sync theme-color + app name metas + apple touch icon.
      upsertMeta("theme-color", themeColor);
      upsertMeta("application-name", shortName);
      upsertMeta("apple-mobile-web-app-title", shortName);
      upsertMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
      setAppleTouchIcon(logoUrl || "/icons/icon-512.png");
    };

    let latest = null;
    let mounted = true;
    let inFlight = null;

    const loadAndApply = async () => {
      // Only one active settings fetch at a time; skip if a fetch is
      // already in progress to avoid duplicate concurrent requests.
      if (inFlight) return inFlight;
      const promise = fetchSettings({ requestKey: "pwa-manifest-settings" })
        .then((s) => {
          if (!mounted) return;
          latest = s;
          apply(latest);
        })
        .catch((e) => {
          // Abort/auto-cancel is expected during unmount or when a
          // newer request supersedes this one — ignore it silently.
          if (isAbortError(e)) return;
          // Any other failure: leave the static manifest in place.
        })
        .finally(() => {
          if (inFlight === promise) inFlight = null;
        });
      inFlight = promise;
      return promise;
    };

    loadAndApply();

    // Realtime: re-apply whenever the settings record changes.
    // Source-aware: Supabase postgres_changes when Supabase is active,
    // otherwise PocketBase realtime. On change we refetch the full
    // settings row (works for both sources) and re-apply.
    const unsubSettings = subscribeCollection("settings", () => {
      if (!mounted) return;
      fetchSettings({ requestKey: "pwa-manifest-settings-rt" })
        .then((s) => {
          if (mounted) {
            latest = s;
            apply(latest);
          }
        })
        .catch((e) => {
          if (!isAbortError(e)) {
            /* leave static manifest */
          }
        });
    });

    return () => {
      mounted = false;
      try {
        unsubSettings && unsubSettings();
      } catch (_) {}
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);
}
