import { useEffect } from 'react';
import { fileUrl } from '@/lib/masjid';

const TYPE_BY_EXT = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
};

/**
 * Applies the masjid favicon (browser tab icon) whenever the settings change.
 * Pass the settings record (or null). When a favicon file is present it
 * replaces the default <link rel="icon">; otherwise the default is kept.
 */
export default function useFavicon(settings) {
    useEffect(() => {
        const filename = settings && settings.favicon ? settings.favicon : '';
        const href = filename ? fileUrl(settings, filename) : '';

        let link = document.querySelector("link[rel='icon']");
        if (!href) return;

        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }

        link.href = href;
        const ext = String(filename).split('.').pop().toLowerCase();
        link.type = TYPE_BY_EXT[ext] || 'image/png';
    }, [settings]);
}
