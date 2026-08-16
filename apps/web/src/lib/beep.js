/**
 * Web Audio API beep generator.
 * Plays a sequence of short "bip" tones (default 5x) using an oscillator.
 * Works in both regular browsers and PWA webviews. The AudioContext is
 * created lazily and resumed on first user gesture / call to satisfy
 * browser autoplay policies.
 */

let audioCtx = null;

function getCtx() {
    if (audioCtx) return audioCtx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    return audioCtx;
}

/**
 * Play a single beep tone.
 * @param {number} freq Frequency in Hz
 * @param {number} startAt Start time (seconds, relative to ctx currentTime)
 * @param {number} duration Duration in seconds
 * @param {number} gain Peak gain
 */
function playTone(ctx, freq, startAt, duration, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startAt);

    // Smooth envelope to avoid clicks
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(g);
    g.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
}

/**
 * Play a sequence of beeps. Resolves when the sequence finishes.
 * @param {object} opts
 * @param {number} opts.count Number of beeps (overrides `seconds`)
 * @param {number} opts.seconds Total play duration in seconds. When given
 *   (and `count` is not), the beep count is computed so the sequence fills
 *   roughly this many seconds. Default 10.
 * @param {number} opts.freq Frequency in Hz (default 880)
 * @param {number} opts.duration Length of each beep in seconds (default 0.18)
 * @param {number} opts.interval Gap between beep starts in seconds (default 0.32)
 * @param {number} opts.gain Peak gain 0–1 (default 0.22)
 */
export function playBeeps(opts = {}) {
    const {
        count,
        seconds = 10,
        freq = 880,
        duration = 0.18,
        interval = 0.32,
        gain = 0.22,
    } = opts;
    const beepCount =
        count != null
            ? count
            : Math.max(1, Math.round((seconds - duration) / interval) + 1);

    return new Promise((resolve) => {
        const ctx = getCtx();
        if (!ctx) {
            resolve(false);
            return;
        }

        // Resume if suspended (autoplay policy). Some browsers require a
        // user gesture; we attempt regardless and still schedule beeps.
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const start = ctx.currentTime + 0.05;
        for (let i = 0; i < beepCount; i++) {
            playTone(ctx, freq, start + i * interval, duration, gain);
        }

        const totalMs = (start + (beepCount - 1) * interval + duration + 0.1 - ctx.currentTime) * 1000;
        setTimeout(() => resolve(true), Math.max(0, totalMs));
    });
}

/**
 * "Unlock" the AudioContext on a user gesture so subsequent programmatic
 * beeps (fired by the clock, not a gesture) are allowed to play.
 */
export function unlockAudio() {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}

export default playBeeps;
