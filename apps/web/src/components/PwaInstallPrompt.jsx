import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Floating "Install app" button shown when the browser fires
 * `beforeinstallprompt` (Chrome / Edge / Android). On iOS the install is
 * done via Share → Add to Home Screen, so no prompt is shown there.
 */
export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        const installedHandler = () => {
            setDeferredPrompt(null);
            setVisible(false);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    if (!visible || dismissed || !deferredPrompt) return null;

    const handleInstall = async () => {
        try {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
        } catch (e) {
            // ignore
        }
        setDeferredPrompt(null);
        setVisible(false);
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-xl border border-[var(--m-primary,#c9a227)]/40 bg-[var(--m-surface,#0d2019)]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <button
                onClick={handleInstall}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--m-text,#ecfdf5)]"
            >
                <Download className="h-5 w-5 text-[var(--m-primary,#c9a227)]" />
                Pasang Aplikasi
            </button>
            <button
                onClick={() => setDismissed(true)}
                aria-label="Tutup"
                className="rounded-md p-1 text-white/60 transition-colors hover:text-white"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
