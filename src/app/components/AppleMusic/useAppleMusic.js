"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const VOLUME_KEY = "peckodoro-apple-music-volume";

// MusicKit's repeat modes are 0 none, 1 one, 2 all; the dock speaks Spotify's names
const REPEAT_NAMES = { 0: "off", 1: "track", 2: "context" };
const REPEAT_ORDER = [0, 2, 1]; // off → all → this song

// Artwork URLs are templates with {w} and {h} placeholders
export const artworkUrl = (artwork, size = 88) =>
  artwork?.url ? artwork.url.replace("{w}", size).replace("{h}", size) : null;

// Load MusicKit once per page, however many times the player mounts
let sdkPromise = null;
function loadMusicKit() {
  if (window.MusicKit) return Promise.resolve(window.MusicKit);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      document.addEventListener("musickitloaded", () => resolve(window.MusicKit), {
        once: true,
      });
      const script = document.createElement("script");
      script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
      script.async = true;
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("Apple Music didn't load. Check your connection."));
      };
      document.body.appendChild(script);
    });
  }
  return sdkPromise;
}

// MusicKit saves its sign-in in localStorage under "music.<teamId>.*", which
// would hand the next person on this browser the last person's account. We keep
// sign-ins in the database against the Peckodoro account instead, and wipe these.
function clearMusicKitStorage() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("music."))
      .forEach((key) => localStorage.removeItem(key));
  } catch {}
}

// Give MusicKit a sign-in token (or none). Passing a function keeps MusicKit
// from writing the token to localStorage; undefined signs out this page only,
// without revoking the token with Apple.
function applyToken(mk, token) {
  mk.musicUserToken = token ? () => token : undefined;
}

async function fetchSavedToken() {
  const res = await fetch("/api/apple-music/user-token", { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return res.ok ? json.token || null : null;
}

// MusicKit is configured once; later mounts reuse the same instance
let instancePromise = null;
function getInstance() {
  if (!instancePromise) {
    instancePromise = (async () => {
      const [MusicKit, res] = await Promise.all([
        loadMusicKit(),
        fetch("/api/apple-music/token", { cache: "no-store" }),
      ]);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.token) {
        throw new Error(json.error || "Apple Music isn't available right now.");
      }
      // Start with no sign-in; the signed-in user's own one is applied after
      clearMusicKitStorage();
      return MusicKit.configure({
        developerToken: json.token,
        app: { name: "Peckodoro", build: "1.0.0" },
      });
    })().catch((err) => {
      instancePromise = null;
      throw err;
    });
  }
  return instancePromise;
}

// Drop the Apple Music sign-in from this page when leaving Peckodoro's account.
// It stays saved to the account, so it's back the next time they sign in.
export async function signOutAppleMusic() {
  clearMusicKitStorage();
  if (!instancePromise) return;
  try {
    const mk = await instancePromise;
    mk.stop?.();
    applyToken(mk, null);
  } catch {}
  clearMusicKitStorage();
}

// Disconnect Apple Music: revoke the sign-in with Apple (when MusicKit is running
// on this page), forget it here, and remove it from the account. Used by the
// music panel and Settings. Resolves true once it's gone from the account.
export async function disconnectAppleMusic() {
  if (instancePromise) {
    try {
      const mk = await instancePromise;
      mk.stop?.();
      await mk.unauthorize().catch(() => {});
      applyToken(mk, null);
    } catch {}
  }
  clearMusicKitStorage();
  const res = await fetch("/api/apple-music/user-token", { method: "DELETE" }).catch(() => null);
  return Boolean(res?.ok);
}

function readVolume() {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0.5;
  } catch {
    return 0.5;
  }
}

function friendlyError(err) {
  const code = err?.errorCode || err?.name;
  if (code === "SUBSCRIPTION_ERROR") {
    return "Playing full songs needs an Apple Music subscription.";
  }
  if (code === "AUTHORIZATION_ERROR" || code === "ACCESS_DENIED") {
    return "Apple Music sign-in didn't finish. Try again.";
  }
  if (code === "CONTENT_UNAVAILABLE" || code === "CONTENT_RESTRICTED") {
    return "That isn't available on Apple Music in your region.";
  }
  return err?.message || "Apple Music didn't respond. Try again.";
}

// MusicKit's now-playing item in the shape the dock reads (Spotify's track shape)
function snapshot(mk) {
  const item = mk.nowPlayingItem;
  if (!item) return null;
  const a = item.attributes || {};
  const art = artworkUrl(a.artwork, 300);
  return {
    track: {
      id: item.id,
      name: a.name ?? item.title,
      artists: [{ name: a.artistName ?? item.artistName }],
      album: { images: art ? [{ url: art }] : [] },
      url: a.url,
    },
    paused: !mk.isPlaying,
    position: (mk.currentPlaybackTime || 0) * 1000,
    duration: (mk.currentPlaybackDuration || 0) * 1000 || a.durationInMillis || 0,
    shuffle: mk.shuffleMode === 1,
    repeat: REPEAT_NAMES[mk.repeatMode] || "off",
    updatedAt: Date.now(),
  };
}

export function useAppleMusic() {
  const mkRef = useRef(null);

  // connecting → ready, or error
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState(null); // { message, canReconnect }
  const [authorized, setAuthorized] = useState(false);
  const [playback, setPlayback] = useState(null);
  const [volume, setVolumeState] = useState(0.5);
  // Bumped whenever the queue moves, so open queue views re-read it
  const [queueVersion, setQueueVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let mk = null;
    const refresh = () => setPlayback(snapshot(mk));
    const onAuth = () => setAuthorized(Boolean(mk.isAuthorized));
    const onQueue = () => setQueueVersion((v) => v + 1);
    const onError = (e) => toast.error(friendlyError(e?.error || e));
    const listeners = [
      ["playbackStateDidChange", refresh],
      ["nowPlayingItemDidChange", refresh],
      ["playbackDurationDidChange", refresh],
      ["shuffleModeDidChange", refresh],
      ["repeatModeDidChange", refresh],
      ["authorizationStatusDidChange", onAuth],
      ["queueItemsDidChange", onQueue],
      ["queuePositionDidChange", onQueue],
      ["mediaPlaybackError", onError],
    ];

    Promise.all([getInstance(), fetchSavedToken().catch(() => null)])
      .then(([instance, savedToken]) => {
        if (cancelled) return;
        mk = instance;
        mkRef.current = mk;
        applyToken(mk, savedToken);
        const initialVolume = readVolume();
        mk.volume = initialVolume;
        setVolumeState(initialVolume);
        listeners.forEach(([name, fn]) => mk.addEventListener(name, fn));
        setAuthorized(Boolean(mk.isAuthorized));
        refresh();
        setStatus("ready");
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError({ message: err.message, canReconnect: false });
      });

    return () => {
      cancelled = true;
      if (mk) {
        listeners.forEach(([name, fn]) => mk.removeEventListener(name, fn));
        // Switching services or signing out shouldn't leave music playing
        mk.stop?.();
      }
      mkRef.current = null;
    };
  }, []);

  // Apple Music API call; `path` can also be a `next` path the API returned
  const api = useCallback(async (path, params) => {
    const mk = mkRef.current;
    if (!mk) throw new Error("Apple Music isn't ready yet");
    const res = await mk.api.music(path, params);
    return res?.data;
  }, []);

  // Sign in to Apple Music; opens Apple's window, so call it from a click.
  // The sign-in is saved to the Peckodoro account, not left in the browser.
  const authorize = useCallback(async () => {
    const mk = mkRef.current;
    if (!mk) return false;
    try {
      await mk.authorize();
    } catch (err) {
      toast.error(friendlyError(err));
    }
    const token = mk.isAuthorized ? mk.musicUserToken : null;
    if (token) {
      applyToken(mk, token);
      clearMusicKitStorage();
      const res = await fetch("/api/apple-music/user-token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => null);
      if (!res?.ok) {
        toast("Apple Music is connected for now", {
          description: "We couldn't save it to your account, so you'll be asked again next time.",
        });
      }
    }
    setAuthorized(Boolean(mk.isAuthorized));
    return Boolean(mk.isAuthorized);
  }, []);

  // Disconnect: revoke the sign-in with Apple and remove it from the account
  const unauthorize = useCallback(async () => {
    if (!(await disconnectAppleMusic())) {
      toast.error("Couldn't disconnect Apple Music. Try again.");
    }
    setAuthorized(false);
    setPlayback(null);
  }, []);

  // Playback needs an Apple Music sign-in; ask for it on the first play
  const run = useCallback(
    async (fn, { needsAuth = true } = {}) => {
      const mk = mkRef.current;
      if (!mk) return;
      try {
        if (needsAuth && !mk.isAuthorized && !(await authorize())) return;
        await fn(mk);
      } catch (err) {
        toast.error(friendlyError(err));
      }
    },
    [authorize]
  );

  const togglePlay = useCallback(
    () => run((mk) => (mk.isPlaying ? mk.pause() : mk.play())),
    [run]
  );
  const next = useCallback(() => run((mk) => mk.skipToNextItem()), [run]);
  const previous = useCallback(() => run((mk) => mk.skipToPreviousItem()), [run]);

  const seek = useCallback(
    (ms) =>
      run(async (mk) => {
        await mk.seekToTime(ms / 1000);
        setPlayback((p) => (p ? { ...p, position: ms, updatedAt: Date.now() } : p));
      }),
    [run]
  );

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (mkRef.current) mkRef.current.volume = v;
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {}
  }, []);

  const toggleShuffle = useCallback(
    () =>
      run((mk) => {
        mk.shuffleMode = mk.shuffleMode === 1 ? 0 : 1;
      }),
    [run]
  );

  const cycleRepeat = useCallback(
    () =>
      run((mk) => {
        const at = REPEAT_ORDER.indexOf(mk.repeatMode);
        mk.repeatMode = REPEAT_ORDER[(at + 1) % REPEAT_ORDER.length];
      }),
    [run]
  );

  // Replace the queue and start playing. `descriptor` is MusicKit's queue
  // description, e.g. { playlist: id }, { album: id } or { songs: [ids] }.
  const play = useCallback(
    (descriptor, { startWith, shuffle } = {}) =>
      run(async (mk) => {
        if (typeof shuffle === "boolean") mk.shuffleMode = shuffle ? 1 : 0;
        await mk.setQueue({
          ...descriptor,
          ...(startWith ? { startWith } : {}),
          startPlaying: true,
        });
      }),
    [run]
  );

  // Adds to the end of the queue; it plays after what's already there
  const addToQueue = useCallback(
    ({ id, name }) =>
      run(async (mk) => {
        await mk.playLater({ song: id });
        setQueueVersion((v) => v + 1);
        toast.success(`Added “${name}” to your queue`);
      }),
    [run]
  );

  // What's left to play after the current song
  const upNext = useCallback(() => {
    const queue = mkRef.current?.queue;
    if (!queue?.items) return [];
    return queue.items.slice(Math.max(queue.position, -1) + 1);
  }, []);

  // Used by pause-on-breaks
  const pause = useCallback(() => mkRef.current?.pause(), []);
  const resume = useCallback(() => mkRef.current?.play(), []);

  return {
    status,
    error,
    // Apple Music always plays in this tab
    isHere: true,
    elsewhere: null,
    playback,
    volume,
    // No saved-songs heart in the dock for Apple Music
    saved: null,
    api,
    authorized,
    authorize,
    unauthorize,
    reconnect: authorize,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    play,
    addToQueue,
    upNext,
    queueVersion,
    pause,
    resume,
  };
}
