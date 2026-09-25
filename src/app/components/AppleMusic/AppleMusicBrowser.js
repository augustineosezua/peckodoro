"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
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
import { artworkUrl } from "./useAppleMusic";

export const AppleMusicMark = ({ size = 16 }) => {
  // Each copy needs its own gradient id: with a shared one, every copy uses the
  // first on the page, and if that copy is hidden the fill disappears everywhere
  const gradientId = `apple-music-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FA5C74" />
          <stop offset="1" stopColor="#FA233B" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="5.5" fill={`url(#${gradientId})`} />
      <path
        d="M16.5 5.2v9.6a2.3 2.3 0 1 1-1.4-2.1V8.4l-5.2 1.1v6.8a2.3 2.3 0 1 1-1.4-2.1V7.2l8-2Z"
        fill="#fff"
      />
    </svg>
  );
};

const Attr = (item) => item?.attributes || {};

// Queues take catalog ids; library songs carry theirs in playParams (uploads have none)
const catalogId = (s) => (s?.type === "songs" ? s.id : Attr(s).playParams?.catalogId);

export default function AppleMusicBrowser({ music, onClose, notice }) {
  const { api, play, addToQueue, playback, queueVersion, upNext, authorized, authorize, unauthorize } =
    music;
  const currentId = playback?.track?.id;

  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [playlists, setPlaylists] = useState(null);
  const [playlistsNext, setPlaylistsNext] = useState(null);
  const [openPlaylist, setOpenPlaylist] = useState(null); // { meta, tracks, next }

  const [recent, setRecent] = useState(null); // { tracks, next }
  const [queue, setQueue] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Catalog search works before signing in; only playing needs an account
  const search = async (text) => {
    const q = text.trim();
    if (!q) return;
    setQuery(q);
    setSearching(true);
    setLoadError(null);
    try {
      const data = await api("/v1/catalog/{{storefrontId}}/search", {
        term: q,
        types: "songs,playlists,albums",
        limit: 10,
      });
      setResults(data?.results || {});
    } catch {
      setLoadError("Search didn't go through. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  const loadMoreSearch = async (kind) => {
    const d = await api(results[kind].next).catch(() => null);
    const more = d?.results?.[kind];
    if (!more) return;
    setResults((prev) => ({
      ...prev,
      [kind]: { ...more, data: [...(prev[kind]?.data || []), ...(more.data || [])] },
    }));
  };

  // Library and history need an Apple Music sign-in; reset them when it changes
  useEffect(() => {
    setPlaylists(null);
    setPlaylistsNext(null);
    setOpenPlaylist(null);
    setRecent(null);
  }, [authorized]);

  useEffect(() => {
    if (tab !== "playlists" || !authorized || playlists) return;
    api("/v1/me/library/playlists", { limit: 100 })
      .then((d) => {
        setPlaylists(d?.data || []);
        setPlaylistsNext(d?.next || null);
      })
      .catch(() => {
        setPlaylists([]);
        setLoadError("Couldn't load your playlists. Try again in a moment.");
      });
  }, [tab, authorized, playlists, api]);

  const loadMorePlaylists = async () => {
    const d = await api(playlistsNext).catch(() => null);
    if (!d) return;
    setPlaylists((prev) => [...(prev || []), ...(d.data || [])]);
    setPlaylistsNext(d.next || null);
  };

  const showPlaylist = async (p) => {
    setOpenPlaylist({ meta: p, tracks: null, next: null });
    try {
      const d = await api(`/v1/me/library/playlists/${p.id}/tracks`, { limit: 100 });
      setOpenPlaylist({ meta: p, tracks: d?.data || [], next: d?.next || null });
    } catch (err) {
      // An empty playlist comes back as 404
      setOpenPlaylist({ meta: p, tracks: [], next: null, failed: err?.status !== 404 });
    }
  };

  const loadMoreTracks = async () => {
    const d = await api(openPlaylist.next).catch(() => null);
    if (!d) return;
    setOpenPlaylist((prev) =>
      prev && { ...prev, tracks: [...prev.tracks, ...(d.data || [])], next: d.next || null }
    );
  };

  useEffect(() => {
    if (tab !== "recent" || !authorized || recent) return;
    api("/v1/me/recent/played/tracks", { limit: 30 })
      .then((d) => setRecent({ tracks: d?.data || [], next: d?.next || null }))
      .catch(() => {
        setRecent({ tracks: [], next: null });
        setLoadError("Couldn't load what you played recently.");
      });
  }, [tab, authorized, recent, api]);

  const loadMoreRecent = async () => {
    const d = await api(recent.next).catch(() => null);
    if (!d) return;
    setRecent((prev) => ({ tracks: [...prev.tracks, ...(d.data || [])], next: d.next || null }));
  };

  // The queue lives in MusicKit, so re-read it whenever it moves
  useEffect(() => {
    if (tab === "queue") setQueue(upNext());
  }, [tab, queueVersion, currentId, upNext]);

  // A list of songs plays through from the one picked
  const playFrom = (songs, song) => {
    const ids = songs.map(catalogId).filter(Boolean);
    const at = ids.indexOf(catalogId(song));
    if (at === -1) return;
    play({ songs: ids }, { startWith: at });
  };

  const songRow = (s, onClick, key = s.id) => (
    <Row
      key={key}
      image={artworkUrl(Attr(s).artwork)}
      title={Attr(s).name}
      subtitle={Attr(s).artistName}
      meta={msToClock(Attr(s).durationInMillis)}
      active={Boolean(currentId) && (s.id === currentId || catalogId(s) === currentId)}
      onClick={onClick}
      onQueue={
        catalogId(s) ? () => addToQueue({ id: catalogId(s), name: Attr(s).name }) : undefined
      }
    />
  );

  const connectPrompt = (what) => (
    <Reconnect onReconnect={authorize} label="Connect">
      Connect Apple Music to see {what}.
    </Reconnect>
  );

  const songs = results?.songs?.data || [];
  const foundPlaylists = results?.playlists?.data || [];
  const albums = results?.albums?.data || [];

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
        <>
          {authorized ? (
            <button
              type="button"
              onClick={unauthorize}
              className="mr-auto text-xs font-semibold text-ink/60 hover:text-ink underline underline-offset-2 cursor-pointer"
            >
              Disconnect
            </button>
          ) : null}
          <span className="flex items-center gap-1.5 text-xs text-ink/55">
            <AppleMusicMark size={14} /> Apple Music
          </span>
        </>
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
              aria-label="Search Apple Music"
              className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-ink/25 focus:border-ink outline-none placeholder-ink/45"
            />
          </form>

          {!authorized ? (
            <p className="px-2 pt-3 text-sm text-ink/60">
              Search freely. You&apos;ll be asked to sign in to Apple Music when you play
              something.
            </p>
          ) : null}

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
            songs.length + foundPlaylists.length + albums.length === 0 ? (
              <Note>Nothing matched “{query}”. Try a different search.</Note>
            ) : (
              <>
                {songs.length ? (
                  <Section title="Songs">
                    {songs.map((s) => songRow(s, () => playFrom(songs, s)))}
                    {results.songs?.next ? (
                      <LoadMore onLoad={() => loadMoreSearch("songs")} />
                    ) : null}
                  </Section>
                ) : null}
                {foundPlaylists.length ? (
                  <Section title="Playlists">
                    {foundPlaylists.map((p) => (
                      <Row
                        key={p.id}
                        image={artworkUrl(Attr(p).artwork)}
                        title={Attr(p).name}
                        subtitle={Attr(p).curatorName}
                        onClick={() => play({ playlist: p.id })}
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
                        image={artworkUrl(Attr(a).artwork)}
                        title={Attr(a).name}
                        subtitle={Attr(a).artistName}
                        meta={Attr(a).releaseDate?.slice(0, 4)}
                        onClick={() => play({ album: a.id })}
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
        !authorized ? (
          connectPrompt("your playlists")
        ) : openPlaylist ? (
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
              {artworkUrl(Attr(openPlaylist.meta).artwork) ? (
                <Image
                  src={artworkUrl(Attr(openPlaylist.meta).artwork, 160)}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-xl object-cover border-2 border-ink"
                />
              ) : null}
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-display)] font-bold text-xl leading-tight line-clamp-2">
                  {Attr(openPlaylist.meta).name}
                </h3>
                {openPlaylist.tracks?.length ? (
                  <p className="text-sm text-ink/60">
                    {openPlaylist.tracks.length}
                    {openPlaylist.next ? "+" : ""} songs
                  </p>
                ) : null}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => play({ playlist: openPlaylist.meta.id }, { shuffle: false })}
                    className="sticker-btn bg-beak px-4 py-1.5 rounded-full font-bold text-sm cursor-pointer"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={() => play({ playlist: openPlaylist.meta.id }, { shuffle: true })}
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
              <Note>
                {openPlaylist.failed
                  ? "Couldn't load this playlist. Try again in a moment."
                  : "This playlist is empty."}
              </Note>
            ) : (
              <>
                {openPlaylist.tracks.map((t, i) =>
                  songRow(
                    t,
                    () =>
                      play({ playlist: openPlaylist.meta.id }, { startWith: i, shuffle: false }),
                    `${t.id}-${i}`
                  )
                )}
                {openPlaylist.next ? <LoadMore onLoad={loadMoreTracks} /> : null}
              </>
            )}
          </div>
        ) : (
          <div className="pt-2">
            {playlists === null ? (
              <Note>Loading your playlists…</Note>
            ) : playlists.length === 0 ? (
              <Note>No playlists yet. Make one in Apple Music and it&apos;ll show up here.</Note>
            ) : null}
            {(playlists || []).map((p) => (
              <Row
                key={p.id}
                image={artworkUrl(Attr(p).artwork)}
                title={Attr(p).name}
                onClick={() => showPlaylist(p)}
              />
            ))}
            {playlistsNext ? <LoadMore onLoad={loadMorePlaylists} /> : null}
          </div>
        )
      ) : null}

      {tab === "recent" ? (
        !authorized ? (
          connectPrompt("what you played recently")
        ) : recent === null ? (
          <Note>Loading…</Note>
        ) : recent.tracks.length === 0 ? (
          <Note>Nothing played recently. Songs show up here after you listen.</Note>
        ) : (
          <div className="pt-2">
            {recent.tracks.map((t, i) => songRow(t, () => playFrom(recent.tracks, t), `${t.id}-${i}`))}
            {recent.next ? <LoadMore onLoad={loadMoreRecent} /> : null}
          </div>
        )
      ) : null}

      {tab === "queue" ? (
        <>
          {playback?.track ? (
            <Section title="Now playing">
              <Row
                image={playback.track.album.images[0]?.url}
                title={playback.track.name}
                subtitle={playback.track.artists[0]?.name}
                active
              />
            </Section>
          ) : null}
          {queue.length ? (
            <Section title="Next up">
              {queue.slice(0, 30).map((item, i) => (
                <Row
                  key={`${item.id}-${i}`}
                  image={artworkUrl(Attr(item).artwork)}
                  title={Attr(item).name ?? item.title}
                  subtitle={Attr(item).artistName ?? item.artistName}
                  meta={msToClock(Attr(item).durationInMillis)}
                />
              ))}
            </Section>
          ) : (
            <Note>Nothing queued. Play an album or playlist to fill this up.</Note>
          )}
        </>
      ) : null}
    </BrowserShell>
  );
}
