"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BrowserShell,
  LoadMore,
  Note,
  QUICK_SEARCHES,
  Reconnect,
  Row,
  Section,
  msToClock,
} from "../Music/BrowserParts";

const smallestImage = (images) =>
  images?.length ? images[images.length - 1].url || images[0].url : null;

export const SpotifyMark = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    <path
      d="M16.7 10.7c-2.5-1.5-6.4-1.7-9-.9a.75.75 0 1 1-.43-1.43c3-.9 7.3-.7 10.2 1a.75.75 0 1 1-.77 1.33Zm-.3 2.5a.62.62 0 0 1-.86.2c-2.1-1.3-5.2-1.7-7.6-1a.62.62 0 1 1-.35-1.19c2.8-.8 6.3-.4 8.6 1.1.3.2.4.6.2.9Zm-1.1 2.4a.5.5 0 0 1-.7.16c-1.9-1.1-4.2-1.4-6.7-.8a.5.5 0 1 1-.24-.97c2.8-.7 5.3-.3 7.5.9.25.15.3.47.14.71Z"
      fill="#fff"
    />
  </svg>
);

const LikedTile = ({ size = "w-11 h-11", icon = 18 }) => (
  <span
    className={`${size} rounded-lg border-2 border-ink bg-beak shrink-0 flex items-center justify-center`}
  >
    <svg width={icon} height={icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.4 4.5 6.9 4.5c2 0 3.6 1.2 5.1 3 1.5-1.8 3.1-3 5.1-3 3.5 0 5.4 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"
        fill="var(--shell)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
    </svg>
  </span>
);

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

// Scopes each tab depends on; missing ones mean the user linked Spotify before we asked for them
const LIBRARY_SCOPES = ["user-library-read"];
const RECENT_SCOPES = ["user-read-recently-played"];

const artistNames = (artists) => (artists || []).map((a) => a.name).join(", ");

export default function MusicBrowser({ spotify, onClose, notice }) {
  const { api, playContext, playTracks, playback, addToQueue, queueVersion, missingScopes, reconnect } =
    spotify;
  const lacks = (scopes) => scopes.some((sc) => missingScopes.includes(sc));
  const currentUri = playback?.track?.uri;
  const currentName = playback?.track?.name;

  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [playlists, setPlaylists] = useState(null);
  const [playlistsNext, setPlaylistsNext] = useState(null);
  const [openPlaylist, setOpenPlaylist] = useState(null); // { meta, tracks, next, total }

  const [queue, setQueue] = useState(null);
  const [recent, setRecent] = useState(null); // { tracks, next }
  const [recentFailed, setRecentFailed] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = async (text) => {
    const q = text.trim();
    if (!q) return;
    setQuery(q);
    setSearching(true);
    setLoadError(null);
    try {
      const data = await api(
        `/search?q=${encodeURIComponent(q)}&type=track,playlist,album&limit=10`
      );
      setResults(data);
    } catch {
      setLoadError("Search didn't go through. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  // Load playlists the first time that tab opens
  useEffect(() => {
    if (tab !== "playlists" || playlists) return;
    api("/me/playlists?limit=50")
      .then((d) => {
        setPlaylists((d?.items || []).filter(Boolean));
        setPlaylistsNext(d?.next || null);
      })
      .catch(() => {
        setPlaylists([]);
        setLoadError("Couldn't load your playlists. Try reconnecting Spotify in Settings.");
      });
  }, [tab, playlists, api]);

  // The queue changes as tracks change, so refetch it whenever it's on screen
  useEffect(() => {
    if (tab !== "queue") return;
    api("/me/player/queue")
      .then((d) => setQueue(d))
      .catch(() => setQueue({ queue: [] }));
  }, [tab, currentUri, queueVersion, api]);

  const playableTracks = (items) =>
    (items || [])
      .map((i) => i?.track || i?.item)
      .filter((t) => t && t.uri && !t.is_local);

  const showPlaylist = async (p) => {
    setOpenPlaylist({ meta: p, tracks: null, next: null, total: 0 });
    try {
      const data = await api(`/playlists/${p.id}/tracks?limit=100`);
      setOpenPlaylist({
        meta: p,
        tracks: playableTracks(data?.items),
        next: data?.next || null,
        total: data?.total || 0,
      });
    } catch {
      setOpenPlaylist({ meta: p, tracks: [], next: null, total: 0 });
    }
  };

  // Paging: each loader fetches Spotify's `next` URL and appends
  const loadMorePlaylists = async () => {
    const d = await api(playlistsNext).catch(() => null);
    if (!d) return;
    setPlaylists((prev) => [...(prev || []), ...(d.items || []).filter(Boolean)]);
    setPlaylistsNext(d.next || null);
  };

  const loadMoreTracks = async () => {
    const d = await api(openPlaylist.next).catch(() => null);
    if (!d) return;
    setOpenPlaylist((prev) =>
      prev && {
        ...prev,
        tracks: [...prev.tracks, ...playableTracks(d.items)],
        next: d.next || null,
      }
    );
  };

  const loadMoreSearch = async (kind) => {
    const d = await api(results[kind].next).catch(() => null);
    if (!d?.[kind]) return;
    setResults((prev) => ({
      ...prev,
      [kind]: {
        ...d[kind],
        items: [...(prev[kind]?.items || []), ...(d[kind].items || [])],
      },
    }));
  };

  const tracks = (results?.tracks?.items || []).filter(Boolean);
  const foundPlaylists = (results?.playlists?.items || []).filter(Boolean);
  const albums = (results?.albums?.items || []).filter(Boolean);

  // Liked Songs works like a playlist whose context is the user's collection
  const showLiked = async () => {
    setOpenPlaylist({ meta: { name: "Liked Songs", liked: true }, tracks: null, next: null, total: 0 });
    try {
      const [me, data] = await Promise.all([api("/me"), api("/me/tracks?limit=50")]);
      setOpenPlaylist({
        meta: { name: "Liked Songs", liked: true, uri: `spotify:user:${me.id}:collection` },
        tracks: playableTracks(data?.items),
        next: data?.next || null,
        total: data?.total || 0,
      });
    } catch {
      setOpenPlaylist({ meta: { name: "Liked Songs", liked: true, failed: true }, tracks: [], next: null, total: 0 });
    }
  };

  // Recently played, newest first, each song once
  const dedupe = (tracks) => {
    const seen = new Set();
    return tracks.filter((t) => t && !seen.has(t.id) && seen.add(t.id));
  };
  const recentTracks = (items) =>
    (items || []).filter((i) => i?.track?.uri).map((i) => ({ ...i.track, played_at: i.played_at }));

  useEffect(() => {
    if (tab !== "recent" || recent) return;
    api("/me/player/recently-played?limit=50")
      .then((d) => setRecent({ tracks: dedupe(recentTracks(d?.items)), next: d?.next || null }))
      .catch(() => {
        setRecent({ tracks: [], next: null });
        setRecentFailed(true);
      });
  }, [tab, recent, api]);

  const loadMoreRecent = async () => {
    const d = await api(recent.next).catch(() => null);
    if (!d) return;
    setRecent((prev) => ({
      tracks: dedupe([...prev.tracks, ...recentTracks(d.items)]),
      next: d.next || null,
    }));
  };

  const playInAlbum = (t) =>
    t.album?.uri ? playContext(t.album.uri, { startUri: t.uri }) : playTracks([t.uri]);

  const tabs = [
    ["search", "Search"],
    ["playlists", "Library"],
    ["recent", "Recent"],
    ["queue", "Up next"],
  ];

  return (
    <BrowserShell
      onClose={onClose}
      notice={notice}
      tabs={tabs}
      tab={tab}
      onTab={(id) => {
        setTab(id);
        setLoadError(null);
      }}
      footer={
        <span className="flex items-center gap-1.5 text-xs text-ink/55">
          <SpotifyMark size={14} /> Spotify
        </span>
      }
    >
      {loadError ? <Note>{loadError}</Note> : null}

      {tab === "search" ? (
        <>
          <form
            className="px-2 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              search(query);
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Songs, albums or playlists"
              aria-label="Search Spotify"
              className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45"
            />
          </form>

          {!results && !searching ? (
            <div className="px-2 pt-4">
              <p className="text-sm text-ink/60 pb-2">Try one of these</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => search(q)}
                    className="px-3 py-1.5 rounded-full border-2 border-ink/20 hover:border-ink text-sm font-semibold cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {searching ? <Note>Searching…</Note> : null}

          {results && !searching ? (
            tracks.length + foundPlaylists.length + albums.length === 0 ? (
              <Note>Nothing matched “{query}”. Try a different search.</Note>
            ) : (
              <>
                {tracks.length ? (
                  <Section title="Songs">
                    {tracks.map((t) => (
                      <Row
                        key={t.id}
                        image={smallestImage(t.album?.images)}
                        title={t.name}
                        subtitle={artistNames(t.artists)}
                        meta={msToClock(t.duration_ms)}
                        active={t.uri === currentUri}
                        onClick={() =>
                          t.album?.uri
                            ? playContext(t.album.uri, { startUri: t.uri })
                            : playTracks([t.uri])
                        }
                        onQueue={() => addToQueue(t)}
                      />
                    ))}
                    {results.tracks?.next ? (
                      <LoadMore onLoad={() => loadMoreSearch("tracks")} />
                    ) : null}
                  </Section>
                ) : null}
                {foundPlaylists.length ? (
                  <Section title="Playlists">
                    {foundPlaylists.map((p) => (
                      <Row
                        key={p.id}
                        image={smallestImage(p.images)}
                        title={p.name}
                        subtitle={p.owner?.display_name}
                        onClick={() => playContext(p.uri)}
                      />
                    ))}
                    {results.playlists?.next ? (
                      <LoadMore onLoad={() => loadMoreSearch("playlists")} />
                    ) : null}
                  </Section>
                ) : null}
                {albums.length ? (
                  <Section title="Albums">
                    {albums.map((a) => (
                      <Row
                        key={a.id}
                        image={smallestImage(a.images)}
                        title={a.name}
                        subtitle={artistNames(a.artists)}
                        meta={a.release_date?.slice(0, 4)}
                        onClick={() => playContext(a.uri)}
                      />
                    ))}
                    {results.albums?.next ? (
                      <LoadMore onLoad={() => loadMoreSearch("albums")} />
                    ) : null}
                  </Section>
                ) : null}
              </>
            )
          ) : null}
        </>
      ) : null}

      {tab === "playlists" ? (
        openPlaylist ? (
          <div>
            <button
              type="button"
              onClick={() => setOpenPlaylist(null)}
              className="flex items-center gap-1 px-2 py-2 text-sm font-semibold text-ink/70 hover:text-ink cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Library
            </button>
            <div className="flex items-center gap-3 px-2 pb-3">
              {openPlaylist.meta.liked ? (
                <LikedTile size="w-20 h-20" icon={34} />
              ) : smallestImage(openPlaylist.meta.images) ? (
                <Image
                  src={openPlaylist.meta.images[0].url}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-xl object-cover border-2 border-ink"
                />
              ) : null}
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-display)] font-bold text-xl leading-tight line-clamp-2">
                  {openPlaylist.meta.name}
                </h3>
                {openPlaylist.total ? (
                  <p className="text-sm text-ink/60">{openPlaylist.total} songs</p>
                ) : null}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => playContext(openPlaylist.meta.uri, { shuffle: false })}
                    disabled={!openPlaylist.meta.uri}
                    className="sticker-btn bg-beak px-4 py-1.5 rounded-full font-bold text-sm cursor-pointer"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={() => playContext(openPlaylist.meta.uri, { shuffle: true })}
                    disabled={!openPlaylist.meta.uri}
                    className="sticker-btn bg-shell px-4 py-1.5 rounded-full font-bold text-sm cursor-pointer"
                  >
                    Shuffle
                  </button>
                </div>
              </div>
            </div>
            {openPlaylist.tracks === null ? (
              <Note>Loading songs…</Note>
            ) : openPlaylist.tracks.length === 0 ? (
              openPlaylist.meta.failed ? (
                <Reconnect onReconnect={reconnect}>
                  Reconnect Spotify to see your Liked Songs.
                </Reconnect>
              ) : (
                <Note>No songs here that Spotify can play.</Note>
              )
            ) : (
              <>
                {openPlaylist.tracks.map((t, i) => (
                  <Row
                    key={`${t.uri}-${i}`}
                    image={smallestImage(t.album?.images)}
                    title={t.name}
                    subtitle={artistNames(t.artists)}
                    meta={msToClock(t.duration_ms)}
                    active={t.uri === currentUri}
                    onClick={() => playContext(openPlaylist.meta.uri, { startUri: t.uri })}
                    onQueue={() => addToQueue(t)}
                  />
                ))}
                {openPlaylist.next ? <LoadMore onLoad={loadMoreTracks} /> : null}
              </>
            )}
          </div>
        ) : (
          <div className="pt-2">
            {lacks(LIBRARY_SCOPES) ? (
              <Reconnect onReconnect={reconnect}>
                Reconnect Spotify to see your Liked Songs here.
              </Reconnect>
            ) : (
              <Row
                tile={<LikedTile />}
                title="Liked Songs"
                subtitle="Songs you've saved"
                onClick={showLiked}
              />
            )}
            {playlists === null ? (
              <Note>Loading your playlists…</Note>
            ) : playlists.length === 0 ? (
              <Note>No playlists yet. Make one in Spotify and it&apos;ll show up here.</Note>
            ) : null}
            {(playlists || []).map((p) => (
              <Row
                key={p.id}
                image={smallestImage(p.images)}
                title={p.name}
                subtitle={`${p.tracks?.total ?? p.items?.total ?? 0} songs`}
                onClick={() => showPlaylist(p)}
              />
            ))}
            {playlistsNext ? <LoadMore onLoad={loadMorePlaylists} /> : null}
          </div>
        )
      ) : null}

      {tab === "recent" ? (
        lacks(RECENT_SCOPES) || recentFailed ? (
          <Reconnect onReconnect={reconnect}>
            Reconnect Spotify to see what you played recently.
          </Reconnect>
        ) : recent === null ? (
          <Note>Loading…</Note>
        ) : recent.tracks.length === 0 ? (
          <Note>Nothing played recently. Songs show up here after you listen.</Note>
        ) : (
          <div className="pt-2">
            {recent.tracks.map((t) => (
              <Row
                key={t.id}
                image={smallestImage(t.album?.images)}
                title={t.name}
                subtitle={artistNames(t.artists)}
                meta={timeAgo(t.played_at)}
                active={t.uri === currentUri}
                onClick={() => playInAlbum(t)}
                onQueue={() => addToQueue(t)}
              />
            ))}
            {recent.next ? <LoadMore onLoad={loadMoreRecent} /> : null}
          </div>
        )
      ) : null}

      {tab === "queue" ? (
        queue === null ? (
          <Note>Loading…</Note>
        ) : (
          <>
            {queue.currently_playing || currentName ? (
              <Section title="Now playing">
                <Row
                  image={smallestImage((queue.currently_playing || playback?.track)?.album?.images)}
                  title={(queue.currently_playing || playback.track).name}
                  subtitle={artistNames((queue.currently_playing || playback.track).artists)}
                  active
                />
              </Section>
            ) : null}
            {queue.queue?.length ? (
              <Section title="Next up">
                {queue.queue.slice(0, 30).map((t, i) => (
                  <Row
                    key={`${t.uri}-${i}`}
                    image={smallestImage(t.album?.images || t.images)}
                    title={t.name}
                    subtitle={artistNames(t.artists) || t.show?.name}
                    meta={msToClock(t.duration_ms)}
                  />
                ))}
              </Section>
            ) : (
              <Note>Nothing queued. Play an album or playlist to fill this up.</Note>
            )}
          </>
        )
      ) : null}
    </BrowserShell>
  );
}
