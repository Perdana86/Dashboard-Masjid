import React, { useEffect, useRef } from 'react';

/**
 * Loads the YouTube IFrame Player API once and resolves with the global YT
 * object. Rejects on script error or timeout so callers can fall back.
 */
let apiPromise = null;
function loadYouTubeAPI() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
            resolve(window.YT);
            return;
        }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof prev === 'function') {
                try { prev(); } catch {}
            }
            resolve(window.YT);
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => reject(new Error('YouTube API gagal dimuat'));
        document.head.appendChild(tag);
        // Safety: if the global callback never fires, give up after 15s.
        setTimeout(() => {
            if (window.YT && window.YT.Player) resolve(window.YT);
            else reject(new Error('YouTube API timeout'));
        }, 15000);
    });
    return apiPromise;
}

/**
 * YouTube slide that stays on screen until the video ends or the live stream
 * stops. Uses the IFrame Player API to observe playback state.
 *
 * @param {object} props
 * @param {string} props.videoId - YouTube video ID
 * @param {() => void} [props.onEnded] - fired when video/live ends (advance)
 * @param {(playing: boolean) => void} [props.onPlayingChange] - playing state
 */
const YouTubeSlide = ({ videoId, onEnded, onPlayingChange }) => {
    const mountRef = useRef(null);
    const playerRef = useRef(null);
    const onEndedRef = useRef(onEnded);
    const onPlayingChangeRef = useRef(onPlayingChange);

    useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
    useEffect(() => { onPlayingChangeRef.current = onPlayingChange; }, [onPlayingChange]);

    useEffect(() => {
        let destroyed = false;
        let player = null;
        let ended = false;

        const fireEnded = () => {
            if (ended) return;
            ended = true;
            const fn = onPlayingChangeRef.current;
            if (typeof fn === 'function') fn(false);
            const end = onEndedRef.current;
            if (typeof end === 'function') end();
        };

        loadYouTubeAPI()
            .then((YT) => {
                if (destroyed || !mountRef.current) return;
                player = new YT.Player(mountRef.current, {
                    videoId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: 1,
                        mute: 1,
                        controls: 0,
                        rel: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        loop: 0,
                        disablekb: 1,
                        fs: 1,
                    },
                    events: {
                        onReady: (e) => {
                            try { e.target.playVideo(); } catch {}
                        },
                        onStateChange: (e) => {
                            const fn = onPlayingChangeRef.current;
                            if (
                                e.data === YT.PlayerState.PLAYING ||
                                e.data === YT.PlayerState.BUFFERING
                            ) {
                                if (typeof fn === 'function') fn(true);
                            } else if (e.data === YT.PlayerState.ENDED) {
                                fireEnded();
                            } else if (e.data === YT.PlayerState.PAUSED) {
                                // Some live streams briefly pause before ending;
                                // don't advance on pause, only on ENDED.
                            }
                        },
                        onError: () => {
                            // Unplayable / removed / restricted — advance so the
                            // slideshow doesn't get stuck on a dead video.
                            fireEnded();
                        },
                    },
                });
                playerRef.current = player;
            })
            .catch(() => {
                // API failed to load — fall back so the slideshow can continue.
                fireEnded();
            });

        return () => {
            destroyed = true;
            if (player && player.destroy) {
                try { player.destroy(); } catch {}
            }
            playerRef.current = null;
        };
    }, [videoId]);

    return (
        <div className="h-full w-full bg-black">
            <div ref={mountRef} className="h-full w-full" />
        </div>
    );
};

export default YouTubeSlide;
