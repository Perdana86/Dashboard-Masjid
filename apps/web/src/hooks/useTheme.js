import { useEffect } from 'react';
import { applyTheme } from '@/lib/masjid';

/**
 * Applies the masjid theme colors (CSS variables on :root) whenever the
 * settings change. Pass the settings record (or null) and the theme updates
 * in real-time across the whole dashboard.
 */
export default function useTheme(settings) {
    useEffect(() => {
        applyTheme(settings);
    }, [settings]);
}
