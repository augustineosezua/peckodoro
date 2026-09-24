"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/app/lib/auth-client";

const API = "https://api.spotify.com/v1";
const VOLUME_KEY = "peckodoro-spotify-volume";

export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-library-modify",
  "user-read-recently-played",
];

// Spotify reports repeat as 0/1/2 in the SDK and as strings in the Web API
const REPEAT_MODES = ["off", "context", "track"];

// Load the Web Playback SDK once per page, however many times the player mounts
let sdkPromise = null;
function loadSdk() {
  if (window.Spotify) return Promise.resolve(window.Spotify);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve) => {
      window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return sdkPromise;
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
  if (err?.reason === "PREMIUM_REQUIRED" || err?.status === 403) {
    return "Spotify playback needs a Premium account.";
  }
  if (err?.reason === "NO_ACTIVE_DEVICE") {
    return "Start playing something first, then you can queue more.";
  }
  if (err?.status === 404) {
    return "Spotify lost track of this tab. Reload the page to reconnect.";
  }
  if (err?.status === 429) {
    return "Spotify is rate limiting requests. Try again in a moment.";
  }
  return err?.message || "Spotify didn't respond. Try again.";
}

export function useSpotify() {
  const tokenRef = useRef({ accessToken: null, expiresAt: 0 });
  const playerRef = useRef(null);
  const deviceIdRef = useRef(null);

  // connecting → ready, or error
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState(null); // { message, canReconnect }
  const [isHere, setIsHere] = useState(false);
  const [elsewhere, setElsewhere] = useState(null); // name of the device playing instead
  const [playback, setPlayback] = useState(null);
  const [volume, setVolumeState] = useState(0.5);
  // Bumped whenever we change the queue, so open queue views refetch
  const [queueVersion, setQueueVersion] = useState(0);
  const [grantedScopes, setGrantedScopes] = useState(null);
  const [saved, setSaved] = useState(null); // is the current track in Liked Songs? null = unknown

  const fail = useCallback((message, canReconnect = false) => {
    setStatus("error");
    setError({ message, canReconnect });
  }, []);

  const getToken = useCallback(async () => {
    const t = tokenRef.current;
    if (t.accessToken && t.expiresAt - Date.now() > 60_000) return t.accessToken;
    const res = await fetch("/api/spotify/token", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.accessToken) {
      const err = new Error(json.error || "Couldn't get a Spotify token");
      err.auth = true;
      throw err;
    }
    tokenRef.current = json;
    if (Array.isArray(json.scopes) && json.scopes.length) setGrantedScopes(json.scopes);
    return json.accessToken;
  }, []);

  // Spotify Web API call. `path` can also be a paging `next` URL Spotify returned.
  // `device: true` targets this tab's player.
  const api = useCallback(
    async (path, { method = "GET", body, device = false } = {}) => {
      if (/^https?:/.test(path) && !path.startsWith(API + "/")) {
        throw new Error("Refusing to send the Spotify token to another host");
      }
      const token = await getToken();
      let url = path.startsWith(API) ? path : API + path;
      if (device && deviceIdRef.current) {
        url += (url.includes("?") ? "&" : "?") + "device_id=" + deviceIdRef.current;
      }
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        const err = new Error(json?.error?.message || `Spotify error ${res.status}`);
        err.status = res.status;
        err.reason = json?.error?.reason;
        throw err;
      }
      return json;
    },
    [getToken]
  );

  // What's playing on the account, when it isn't this tab
  const checkRemote = useCallback(async () => {
    try {
      const state = await api("/me/player");
      if (!state || state.device?.id === deviceIdRef.current) {
        setElsewhere(null);
        return state;
      }
      const name = state.device?.name;
      setElsewhere(
        !state.is_playing
          ? null
          : name === "Peckodoro"
            ? "another Peckodoro tab"
            : name || "another device"
      );
      if (state.item) {
        setPlayback({
          track: state.item,
          paused: !state.is_playing,
          position: state.progress_ms || 0,
          duration: state.item.duration_ms || 0,
          shuffle: state.shuffle_state,
          repeat: state.repeat_state || "off",
          updatedAt: Date.now(),
        });
      }
      return state;
    } catch {
      return null;
    }
  }, [api]);

  useEffect(() => {
    const initialVolume = readVolume();
    setVolumeState(initialVolume);

    let cancelled = false;
    let player = null;

    loadSdk().then((Spotify) => {
      if (cancelled) return;
      player = new Spotify.Player({
        name: "Peckodoro",
        volume: initialVolume,
        enableMediaSession: true,
        getOAuthToken: (cb) => {
          getToken()
            .then(cb)
            .catch(() => fail("Spotify needs to be reconnected.", true));
        },
      });
      playerRef.current = player;

      player.addListener("ready", async ({ device_id }) => {
        deviceIdRef.current = device_id;
        setStatus("ready");
        setError(null);
        // Become the active device only if nothing is playing elsewhere; never hijack
        const remote = await checkRemote();
        if (!remote || !remote.is_playing) {
          api("/me/player", {
            method: "PUT",
            body: { device_ids: [device_id], play: false },
          }).catch(() => {});
        }
      });

      player.addListener("not_ready", () => setIsHere(false));

      player.addListener("player_state_changed", (state) => {
        if (!state) {
          setIsHere(false);
          checkRemote();
          return;
        }
        setIsHere(true);
        setElsewhere(null);
        setPlayback({
          track: state.track_window.current_track,
          paused: state.paused,
          position: state.position,
          duration: state.duration,
          shuffle: state.shuffle,
          repeat: REPEAT_MODES[state.repeat_mode] || "off",
          updatedAt: Date.now(),
        });
      });

      player.addListener("initialization_error", () =>
        fail("This browser can't play Spotify. Try Chrome, Edge or Firefox.")
      );
      player.addListener("authentication_error", () =>
        fail("Spotify needs to be reconnected.", true)
      );
      player.addListener("account_error", () =>
        fail("Spotify playback needs a Premium account.")
      );
      player.addListener("playback_error", ({ message }) =>
        toast.error(`Spotify couldn't play that track. ${message || ""}`.trim())
      );

      player.connect();
    });

    return () => {
      cancelled = true;
      player?.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
    };
  }, [api, checkRemote, fail, getToken]);

  // While music plays on another device, keep its track info fresh
  useEffect(() => {
    if (status !== "ready" || isHere || !elsewhere) return;
    const id = setInterval(checkRemote, 15_000);
    return () => clearInterval(id);
  }, [status, isHere, elsewhere, checkRemote]);

  const run = useCallback(async (fn) => {
    try {
      // Browsers need a user gesture before audio; this call is made inside one
      playerRef.current?.activateElement?.();
      await fn();
    } catch (err) {
      if (err?.auth) fail("Spotify needs to be reconnected.", true);
      else toast.error(friendlyError(err));
    }
  }, [fail]);

  const playHere = useCallback(
    (play = true) =>
      run(() =>
        api("/me/player", {
          method: "PUT",
          body: { device_ids: [deviceIdRef.current], play },
        })
      ),
    [api, run]
  );

  const togglePlay = useCallback(() => {
    if (!isHere) return playHere(true);
    return run(() => playerRef.current.togglePlay());
  }, [isHere, playHere, run]);

  const next = useCallback(
    () => run(() => playerRef.current.nextTrack()),
    [run]
  );
  const previous = useCallback(
    () => run(() => playerRef.current.previousTrack()),
    [run]
  );

  const seek = useCallback(
    (ms) =>
      run(async () => {
        await playerRef.current.seek(ms);
        setPlayback((p) => (p ? { ...p, position: ms, updatedAt: Date.now() } : p));
      }),
    [run]
  );

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    playerRef.current?.setVolume(v);
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {}
  }, []);

  const toggleShuffle = useCallback(
    () =>
      run(async () => {
        const nextState = !playback?.shuffle;
        await api(`/me/player/shuffle?state=${nextState}`, {
          method: "PUT",
          device: true,
        });
        setPlayback((p) => (p ? { ...p, shuffle: nextState } : p));
      }),
    [api, playback?.shuffle, run]
  );

  // Play an album/playlist/artist, optionally starting at a given track
  const playContext = useCallback(
    (contextUri, { startUri, shuffle } = {}) =>
      run(async () => {
        if (typeof shuffle === "boolean") {
          await api(`/me/player/shuffle?state=${shuffle}`, {
            method: "PUT",
            device: true,
          }).catch(() => {});
        }
        await api("/me/player/play", {
          method: "PUT",
          device: true,
          body: {
            context_uri: contextUri,
            ...(startUri ? { offset: { uri: startUri } } : {}),
          },
        });
      }),
    [api, run]
  );

  const playTracks = useCallback(
    (uris, { startUri } = {}) =>
      run(() =>
        api("/me/player/play", {
          method: "PUT",
          device: true,
          body: { uris, ...(startUri ? { offset: { uri: startUri } } : {}) },
        })
      ),
    [api, run]
  );

  // Adds to the end of the user's queue; it plays after the current track
  const addToQueue = useCallback(
    (track) =>
      run(async () => {
        await api(`/me/player/queue?uri=${encodeURIComponent(track.uri)}`, {
          method: "POST",
          device: isHere,
        });
        setQueueVersion((v) => v + 1);
        toast.success(`Added “${track.name}” to your queue`);
      }),
    [api, isHere, run]
  );

  const cycleRepeat = useCallback(
    () =>
      run(async () => {
        const current = REPEAT_MODES.indexOf(playback?.repeat || "off");
        const nextMode = REPEAT_MODES[(current + 1) % REPEAT_MODES.length];
        await api(`/me/player/repeat?state=${nextMode}`, { method: "PUT", device: isHere });
        setPlayback((p) => (p ? { ...p, repeat: nextMode } : p));
      }),
    [api, isHere, playback?.repeat, run]
  );

  // Is the current track in Liked Songs? Re-checked whenever the track changes.
  const trackId = playback?.track?.id;
  useEffect(() => {
    if (status !== "ready" || !trackId) {
      setSaved(null);
      return;
    }
    let stale = false;
    api(`/me/tracks/contains?ids=${trackId}`)
      .then((r) => !stale && setSaved(Array.isArray(r) ? Boolean(r[0]) : null))
      .catch(() => !stale && setSaved(null));
    return () => {
      stale = true;
    };
  }, [api, status, trackId]);

  const toggleSaved = useCallback(
    () =>
      run(async () => {
        if (!trackId) return;
        const nextSaved = !saved;
        await api(`/me/tracks?ids=${trackId}`, { method: nextSaved ? "PUT" : "DELETE" });
        setSaved(nextSaved);
        toast.success(nextSaved ? "Saved to Liked Songs" : "Removed from Liked Songs");
      }),
    [api, run, saved, trackId]
  );

  // Used by pause-on-breaks; quiet no-ops when this tab isn't the one playing
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const resume = useCallback(() => playerRef.current?.resume(), []);

  const listDevices = useCallback(async () => {
    const d = await api("/me/player/devices");
    return (d?.devices || []).map((dev) => ({
      ...dev,
      isThisTab: dev.id === deviceIdRef.current,
    }));
  }, [api]);

  const transferTo = useCallback(
    (id) =>
      run(async () => {
        await api("/me/player", { method: "PUT", body: { device_ids: [id], play: true } });
        // Give Spotify a moment, then pick up the new device's state
        setTimeout(checkRemote, 1200);
      }),
    [api, checkRemote, run]
  );

  const missingScopes = grantedScopes
    ? SPOTIFY_SCOPES.filter((sc) => !grantedScopes.includes(sc))
    : [];

  const reconnect = useCallback(
    () =>
      authClient.linkSocial({
        provider: "spotify",
        callbackURL: "/",
        scopes: SPOTIFY_SCOPES,
      }),
    []
  );

  return {
    status,
    error,
    isHere,
    elsewhere,
    playback,
    volume,
    api,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    playHere,
    playContext,
    playTracks,
    addToQueue,
    queueVersion,
    cycleRepeat,
    saved,
    toggleSaved,
    pause,
    resume,
    listDevices,
    transferTo,
    missingScopes,
    reconnect,
  };
}
