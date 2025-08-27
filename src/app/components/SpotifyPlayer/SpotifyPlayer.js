"use client";
import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import SpotifySearch from "./SpofiySearch";
const track = {
  name: "",
  album: {
    images: [{ url: "" }],
  },
  artists: [{ name: "" }],
};
const playButton = (
  <Image src="/player-play.svg" alt="Play" width={30} height={30} />
);
const pauseButton = (
  <Image src="/player-pause.svg" alt="Pause" width={30} height={30} />
);
const nextButton = (
  <Image src="/player-skip-forward.svg" alt="Next" width={30} height={30} />
);
const prevButton = (
  <Image src="/player-skip-back.svg" alt="Previous" width={30} height={30} />
);

function msToMinSec(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function SpotifyPlayer(props) {
  const session = props.session;
  const play = props.play || false;
  const player = props.player || null;
  const setPlayer = props.setPlayer || (() => {});
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(track);
  const [position, setPosition] = useState(0);
  const positionRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const deviceId = useRef(null);
  const [isCurrentDevice, setIsCurrentDevice] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [volume, setNewVolume] = useState(0.15);
  const [playlists, setPlaylists] = useState({ items: [] });
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState({
    name: "",
    tracks: { items: [] },
  });
  const [data, setData] = useState(null);
  const [queue, setQueue] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum distance required to trigger swipe
  const minSwipeDistance = 50;

  // Touch handlers for swipe navigation
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Only handle swipes on mobile expanded view
    if (window.innerWidth < 1024 && showControls) {
      if (isLeftSwipe && !showPlaylist) {
        setShowPlaylist(true);
      } else if (isRightSwipe && showPlaylist && !currentPlaylist.name) {
        setShowPlaylist(false);
      }
    }
  };

  useEffect(() => {
    if (!showControls) return;

    const handleBodyClick = (e) => {
      // If the clicked element (or any of its parents) is part of Spotify-related UI, do nothing.
      if (e.target.closest("#spotify-player-controls, .spotify-related")) {
        return;
      }
      // Otherwise, hide the controls.
      setShowControls(false);
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setShowControls(false);
      }
    };

    document.body.addEventListener("click", handleBodyClick);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.body.removeEventListener("click", handleBodyClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showControls]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = async () => {
      const player = new window.Spotify.Player({
        name: "Peckodoro",
        getOAuthToken: async (cb) => {
          const response = await fetch("/api/spotify/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: session.user.id }),
          });
          const json = await response.json();
          if (json.accessToken) {
            setAccessToken(json.accessToken);
          } else {
            toast.error(
              "Failed to refresh Spotify access token, please refresh the page."
            );
          }

          cb(json.accessToken);
        },
        volume: 0.15,
        enableMediaSession: true,
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }) => {
        deviceId.current = device_id;
        activateDevices([device_id]);
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });
      player.addListener("player_state_changed", (state) => {
        if (!state) {
          setIsCurrentDevice(false);
          return;
        }

        setIsCurrentDevice(true);
        setTrack(state.track_window.current_track);
        setPaused(state.paused);
        player.getCurrentState().then((state) => {
          !state ? setActive(false) : setActive(true);
        });
      });

      player.connect();
    };
    return () => {
      document.body.removeChild(script);
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const activateDevices = async (deviceIds) => {
    if (!accessToken) {
      return;
    }
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: deviceIds,
        play: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to transfer playback:", response.status, errorText);
    } else {
    }
  };

  const swithBackToPlayer = async () => {
    if (!player) return;
    activateDevices([deviceId.current]);
  };

  useEffect(() => {
    setDuration(current_track?.duration_ms || 0);
    if (is_paused) {
      positionRef.current = null;
      clearInterval(positionRef.current);
    } else if (!is_paused) {
      positionRef.current = setInterval(() => {
        if (!player || !current_track) return;
        player.getCurrentState().then((state) => {
          if (state) {
            setPosition(state.position);
          }
        });
      }, 1000);
    }
    getQueue();
  }, [current_track]);

  useEffect(() => {
    handleSearch(null, "Lofi");
    fetchLibary();
  }, [is_active]);

  const handleVolumeChange = async (e) => {
    const newVolume = parseFloat(e.target.value);
    setNewVolume(newVolume);
    await player.setVolume(newVolume);
  };

  const fetchLibary = async () => {
    const res1 = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userData = await res1.json();
    const user = userData.uri.split(":").pop();
    const res2 = await fetch(
      `https://api.spotify.com/v1/users/${user}/playlists`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const playlistsData = await res2.json();
    setPlaylists(playlistsData);
  };

  const setPlaylist = async (playlistId) => {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const info = await res.json();
    setShowPlaylist(true);
    setCurrentPlaylist(info);
  };

  const playPlaylist = async (start) => {
    const requestBody = {
      context_uri: `spotify:playlist:${currentPlaylist.id}`,
    };
    if (start) {
      requestBody.offset = { position: start };
    }
    await setShuffleOn();
    await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  };

  const setShuffleOff = async () => {
    await fetch("https://api.spotify.com/v1/me/player/shuffle?state=false", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  };

  const playTrack = async (uri, start) => {
    await setShuffleOn();
    fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [uri],
      }),
    });
  };

  const setShuffleOn = async () => {
    await fetch("https://api.spotify.com/v1/me/player/shuffle?state=true", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  };

  const handleSearch = async (e, text) => {
    if (e) {
      e.preventDefault();
    }
    let searchText = text || e.target[0].value;
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchText)}&type=album%2Cplaylist%2Ctrack%2Cartist&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();
    setData(data);
  };

  const getQueue = async () => {
    const response = await fetch(
      " https://api.spotify.com/v1/me/player/queue ",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const json = await response.json();
    setQueue(json.queue);
  };

  const albumImg = current_track?.album?.images?.[0]?.url || "";
  const songName = current_track?.name || "Song Name";
  const artists =
    current_track?.artists?.map((a) => a.name).join(", ") || "Artist";
  const albumName = current_track?.album?.name || "Album";

  if (play) {
    return (
      <>
        {showControls ? (
          <div
            className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1a1a] to-black text-white spotify-related"
            id="spotify-player-controls"
          >
            {/* Desktop Backdrop - click to close */}
            <div
              className="hidden lg:block absolute inset-0 z-0"
              onClick={() => setShowControls(false)}
            />

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#282828] relative z-10">
              <h1 className="text-xl font-bold">Spotify Player</h1>
              <button
                className="text-[#b3b3b3] hover:text-white text-2xl transition-all duration-200 p-2 hover:bg-[#282828] rounded-full"
                onClick={() => setShowControls(false)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex gap-6 p-6 pt-10 h-full relative z-10">
              {/* Desktop Close Button */}
              <button
                className="absolute top-4 right-6 z-30 text-[#b3b3b3] hover:text-white text-2xl transition-all duration-200 p-3 hover:bg-[#282828] rounded-full group shadow-lg"
                onClick={() => setShowControls(false)}
                title="Close Spotify Controls (Press Esc)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Desktop Escape hint */}
              <div className="absolute top-16 right-6 z-30 text-xs text-[#666] bg-[#1a1a1a] px-2 py-1 rounded border border-[#333] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Press Esc to close
              </div>
              {/* Library Section */}
              <div className="bg-[#121212] w-1/2 overflow-y-auto py-6 px-4 rounded-2xl scrollbar-thin border border-[#282828] shadow-lg relative z-20">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-[#1db954]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 22a1 1 0 01-1-1V3a1 1 0 012 0v18a1 1 0 01-1 1zM15.5 2.134A1 1 0 0014 3v18a1 1 0 001.5.866l8-9a1 1 0 000-1.732l-8-9z" />
                  </svg>
                  <span className="text-white text-lg font-bold">
                    Your Library
                  </span>
                </div>

                {playlists.items.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => setPlaylist(playlist.id)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-all duration-200 group"
                  >
                    <div className="relative">
                      <img
                        src={playlist.images?.[0]?.url || "/window.svg"}
                        alt={playlist.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow"
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-white text-sm font-semibold truncate group-hover:text-[#1db954] transition-colors">
                        {playlist.name}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-[#b3b3b3]">
                        <span>Playlist</span>
                        <span>•</span>
                        <span className="truncate">
                          {playlist.owner.display_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content */}
              <div className="w-full overflow-y-auto h-full bg-[#121212] rounded-2xl grow spotify-related border border-[#282828] shadow-lg scrollbar-thin relative z-20">
                {showPlaylist ? (
                  <div className="w-full h-full">
                    {/* Playlist Header */}
                    <div className="bg-gradient-to-b from-[#333] to-[#121212] p-6 border-b border-[#282828]">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() => playPlaylist()}
                          className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M5 3.867v16.266L19.5 12 5 3.867z" />
                          </svg>
                          Shuffle Play
                        </button>
                        <button
                          className="text-[#b3b3b3] hover:text-white text-2xl transition-colors p-2 hover:bg-[#282828] rounded-full"
                          onClick={() => setShowPlaylist(false)}
                        >
                          ×
                        </button>
                      </div>
                      <h1 className="text-white text-2xl font-bold mb-2">
                        {currentPlaylist.name}
                      </h1>
                      <p className="text-[#b3b3b3] text-sm">
                        {currentPlaylist.tracks?.items?.length || 0} songs
                      </p>
                    </div>

                    {/* Track List */}
                    <div className="p-4">
                      {currentPlaylist.tracks?.items?.map(({ track }, i) => (
                        <div
                          key={`desktop-playlist-${track.id}-${i}-${track.uri || Date.now()}`}
                          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-all duration-200 group"
                          onClick={() => playPlaylist(i)}
                        >
                          <span className="text-[#b3b3b3] text-sm w-4 text-right tabular-nums group-hover:text-white transition-colors">
                            {i + 1}
                          </span>
                          <img
                            src={track.album?.images?.[2]?.url || "/window.svg"}
                            alt={track.name}
                            className="w-10 h-10 rounded-md object-cover shadow-sm"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-white text-sm font-medium truncate group-hover:text-[#1db954] transition-colors">
                              {track.name}
                            </span>
                            <span className="text-[#b3b3b3] text-xs truncate">
                              {track.artists?.map((a) => a.name).join(", ")}
                            </span>
                          </div>
                          {track.explicit && (
                            <span className="text-xs text-[#b3b3b3] bg-[#282828] px-2 py-0.5 rounded">
                              E
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Search Header */}
                    <div className="p-6 border-b border-[#282828]">
                      <h1 className="text-white text-2xl font-bold mb-6">
                        Search
                      </h1>
                      <form
                        onSubmit={(e) => handleSearch(e)}
                        className="w-full"
                      >
                        <div className="relative">
                          <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a7a7a7]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <input
                            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#333] text-white pl-12 pr-4 py-3 rounded-full text-sm placeholder-[#6a6a6a] focus:outline-none focus:ring-2 focus:ring-[#1db954] transition-all duration-200"
                            placeholder="What do you want to play?"
                          />
                        </div>
                      </form>
                    </div>

                    {/* Search Results */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                      <SpotifySearch
                        data={data}
                        accessToken={accessToken}
                        setQueue={setQueue}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Queue Section */}
              <div className="w-1/2 h-full bg-[#121212] rounded-2xl overflow-hidden border border-[#282828] shadow-lg relative z-20">
                <div className="p-4 border-b border-[#282828] bg-[#1a1a1a]">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-[#1db954]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    <h2 className="text-white font-bold text-base">Queue</h2>
                  </div>
                </div>

                <div className="overflow-y-auto h-full scrollbar-thin">
                  {queue && queue.length > 0 ? (
                    <div className="p-2">
                      {queue.map((item, index) => (
                        <div
                          key={`queue-${item.id}-${index}-${item.uri || Date.now()}`}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-all duration-200 group"
                        >
                          <img
                            src={item.album?.images?.[2]?.url || "/window.svg"}
                            alt={item.name}
                            className="w-12 h-12 rounded-md object-cover shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium truncate group-hover:text-[#1db954] transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[#b3b3b3] text-xs truncate">
                              {item.artists?.map((a) => a.name).join(", ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-6">
                      <svg
                        className="w-8 h-8 text-[#535353] mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <p className="text-[#b3b3b3] text-sm">
                        No tracks in queue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div
              className="lg:hidden h-full flex flex-col relative z-10"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Mobile Tab Navigation */}
              <div className="flex bg-[#121212] border-b border-[#282828] relative">
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                    !showPlaylist
                      ? "text-white border-b-2 border-[#1db954]"
                      : "text-[#b3b3b3]"
                  }`}
                  onClick={() => setShowPlaylist(false)}
                >
                  Search
                  {!showPlaylist && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954]" />
                  )}
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                    showPlaylist
                      ? "text-white border-b-2 border-[#1db954]"
                      : "text-[#b3b3b3]"
                  }`}
                  onClick={() => setShowPlaylist(true)}
                >
                  Library
                  {showPlaylist && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954]" />
                  )}
                </button>

                {/* Swipe indicator */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-1 bg-[#333] rounded-full">
                    <div
                      className="w-3 h-1 bg-[#666] rounded-full transition-transform duration-300"
                      style={{
                        transform: showPlaylist
                          ? "translateX(100%)"
                          : "translateX(0%)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {currentPlaylist.name && showPlaylist ? (
                  <div className="p-4">
                    {/* Mobile Playlist Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        className="text-[#b3b3b3] hover:text-white text-xl transition-colors p-2 hover:bg-[#282828] rounded-full"
                        onClick={() =>
                          setCurrentPlaylist({
                            name: "",
                            tracks: { items: [] },
                          })
                        }
                      >
                        ←
                      </button>
                      <h2 className="text-white text-xl font-bold flex-1 truncate">
                        {currentPlaylist.name}
                      </h2>
                    </div>

                    <button
                      onClick={() => playPlaylist()}
                      className="w-full flex items-center justify-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M5 3.867v16.266L19.5 12 5 3.867z" />
                      </svg>
                      Shuffle Play
                    </button>

                    {/* Mobile Track List */}
                    {currentPlaylist.tracks?.items?.map(({ track }, i) => (
                      <div
                        key={`mobile-playlist-${track.id}-${i}-${track.uri || Date.now()}`}
                        className="flex items-center gap-4 px-3 py-4 rounded-lg active:bg-[#1a1a1a] transition-colors"
                        onClick={() => playPlaylist(i)}
                      >
                        <span className="text-[#b3b3b3] text-sm w-6 text-center tabular-nums">
                          {i + 1}
                        </span>
                        <img
                          src={track.album?.images?.[2]?.url || "/window.svg"}
                          alt={track.name}
                          className="w-12 h-12 rounded-md object-cover shadow-sm"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-white text-base font-medium truncate">
                            {track.name}
                          </span>
                          <span className="text-[#b3b3b3] text-sm truncate">
                            {track.artists?.map((a) => a.name).join(", ")}
                          </span>
                        </div>
                        {track.explicit && (
                          <span className="text-xs text-[#b3b3b3] bg-[#282828] px-2 py-1 rounded">
                            E
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : showPlaylist ? (
                  <div className="p-4">
                    <h2 className="text-white text-xl font-bold mb-4">
                      Your Library
                    </h2>
                    {playlists.items.map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => setPlaylist(playlist.id)}
                        className="flex items-center gap-3 px-3 py-4 rounded-lg active:bg-[#1a1a1a] transition-colors"
                      >
                        <img
                          src={playlist.images?.[0]?.url || "/window.svg"}
                          alt={playlist.name}
                          className="w-14 h-14 rounded-lg object-cover shadow-md"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-white text-base font-semibold truncate">
                            {playlist.name}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-[#b3b3b3]">
                            <span>Playlist</span>
                            <span>•</span>
                            <span className="truncate">
                              {playlist.owner.display_name}
                            </span>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-[#b3b3b3]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <h2 className="text-white text-xl font-bold mb-4">
                      Search
                    </h2>
                    <form
                      onSubmit={(e) => handleSearch(e)}
                      className="w-full mb-6"
                    >
                      <div className="relative">
                        <svg
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a7a7a7]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#333] text-white pl-12 pr-4 py-4 rounded-xl text-base placeholder-[#6a6a6a] focus:outline-none focus:ring-2 focus:ring-[#1db954] transition-all duration-200"
                          placeholder="What do you want to play?"
                        />
                      </div>
                    </form>

                    <SpotifySearch
                      data={data}
                      accessToken={accessToken}
                      setQueue={setQueue}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Bottom Player Bar - Enhanced */}
        <div className="w-full bg-gradient-to-r from-[#0a0a0a] via-black to-[#0a0a0a] flex items-center px-4 lg:px-6 py-3 lg:py-4 justify-between relative font-[family-name:var(--font-geist-sans)] spotify-related border-t border-[#282828] shadow-2xl">
          {/* Left: Album Art & Track Info */}
          <div className="flex items-center w-full lg:w-[20rem] spotify-related">
            <Link
              href={`https://open.spotify.com/track/${current_track.uri?.split(":").pop()}`}
              className="flex-shrink-0 group"
              target="_blank"
            >
              <div className="relative">
                <Image
                  src={albumImg || "/window.svg"}
                  alt={albumName}
                  width={50}
                  height={50}
                  className="lg:w-[60px] lg:h-[60px] rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            <div className="ml-3 lg:ml-4 flex flex-col min-w-0 flex-1 lg:flex-none lg:max-w-[180px]">
              <span className="text-white text-sm lg:text-base font-semibold truncate hover:text-[#1db954] cursor-pointer transition-colors">
                {songName}
              </span>
              <span className="text-[#b3b3b3] text-xs lg:text-sm truncate hover:text-white hover:underline cursor-pointer transition-colors">
                {artists}
              </span>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                className="text-[#b3b3b3] hover:text-white text-xl cursor-pointer transition-all duration-200 hover:scale-110 p-2"
                title="Previous"
                onClick={() => player.previousTrack()}
              >
                {prevButton}
              </button>
              <button
                className="text-[#b3b3b3] hover:text-white text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-110 bg-white/10 hover:bg-white/20 rounded-full p-2"
                title="Play/Pause"
                onClick={async () => await player.togglePlay()}
              >
                {is_paused ? playButton : pauseButton}
              </button>
              <button
                className="text-[#b3b3b3] hover:text-white text-xl font-bold cursor-pointer transition-all duration-200 hover:scale-110 p-2"
                title="Next"
                onClick={() => player.nextTrack()}
              >
                {nextButton}
              </button>
            </div>
          </div>

          {/* Center: Desktop Controls & Progress */}
          <div className="hidden lg:flex flex-col items-center flex-1 w-full h-full justify-between py-1 max-w-[600px] spotify-related">
            <div className="flex items-center gap-6 mb-2 select-none">
              <button
                className="text-[#b3b3b3] hover:text-white text-xl cursor-pointer transition-all duration-200 hover:scale-110"
                title="Previous"
                onClick={() => player.previousTrack()}
              >
                {prevButton}
              </button>
              <button
                className="text-[#b3b3b3] hover:text-white text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-110 bg-white/10 hover:bg-white/20 rounded-full p-2"
                title="Play/Pause"
                onClick={async () => await player.togglePlay()}
              >
                {is_paused ? playButton : pauseButton}
              </button>
              <button
                className="text-[#b3b3b3] hover:text-white text-xl font-bold cursor-pointer transition-all duration-200 hover:scale-110"
                title="Next"
                onClick={() => player.nextTrack()}
              >
                {nextButton}
              </button>
            </div>

            <div className="w-full flex items-center gap-3">
              <span className="text-xs text-[#b3b3b3] min-w-[40px] text-right tabular-nums">
                {msToMinSec(position)}
              </span>
              <div className="flex-1 h-1 bg-[#4a4a4a] rounded-full overflow-hidden group cursor-pointer">
                <div
                  className="h-full bg-[#b3b3b3] group-hover:bg-[#1db954] rounded-full transition-colors relative"
                  style={{ width: `${(position / duration) * 100 || 0}%` }}
                >
                  <div className="w-3 h-3 bg-white rounded-full absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                </div>
              </div>
              <span className="text-xs text-[#b3b3b3] min-w-[40px] tabular-nums">
                {msToMinSec(duration)}
              </span>
            </div>
          </div>

          {/* Right: Device Info / Return Control */}
          <div className="flex items-center justify-end gap-2 lg:gap-4 spotify-related">
            {/* Mobile Spotify Button */}
            <button
              className="lg:hidden flex items-center gap-2 text-white cursor-pointer hover:text-[#1db954] transition-colors p-2 rounded-lg hover:bg-white/10"
              onClick={() => setShowControls(!showControls)}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg"
                alt="Spotify Logo"
                className="w-16 h-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </button>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-4">
              {!isCurrentDevice ? (
                <button
                  className="bg-[#1db954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  onClick={swithBackToPlayer}
                >
                  Play On Peckodoro
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 text-white cursor-pointer hover:text-[#1db954] transition-colors p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowControls(!showControls)}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg"
                    alt="Spotify Logo"
                    className="w-20 h-auto opacity-80 hover:opacity-100 transition-opacity"
                  />
                </button>
              )}

              <div className="flex items-center gap-3 min-w-[120px]">
                <svg
                  className="w-4 h-4 text-[#b3b3b3] flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                <div className="flex-1 relative group flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-transparent outline-none transition-all duration-200 group-hover:h-1.5"
                    style={{
                      background: `linear-gradient(to right, #1db954 0%, #1db954 ${volume * 100}%, #4a4a4a ${volume * 100}%, #4a4a4a 100%)`,
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                    }}
                    aria-label="Volume"
                  />
                  <style jsx>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      -webkit-appearance: none;
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      background: #ffffff;
                      cursor: pointer;
                      border: none;
                      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                      opacity: 0;
                      transition: opacity 0.2s ease;
                    }

                    input[type="range"]:hover::-webkit-slider-thumb {
                      opacity: 1;
                      transform: scale(1.2);
                    }

                    input[type="range"]::-moz-range-thumb {
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      background: #ffffff;
                      cursor: pointer;
                      border: none;
                      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                      opacity: 0;
                      transition: opacity 0.2s ease;
                    }

                    input[type="range"]:hover::-moz-range-thumb {
                      opacity: 1;
                      transform: scale(1.2);
                    }

                    input[type="range"]::-moz-range-track {
                      background: transparent;
                      border: none;
                    }
                  `}</style>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 px-4 pb-1">
            <div className="w-full flex items-center gap-2 text-xs">
              <span className="text-[#b3b3b3] min-w-[35px] text-right tabular-nums">
                {msToMinSec(position)}
              </span>
              <div className="flex-1 h-1 bg-[#4a4a4a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1db954] rounded-full transition-all progress-bar"
                  style={{ width: `${(position / duration) * 100 || 0}%` }}
                />
              </div>
              <span className="text-[#b3b3b3] min-w-[35px] tabular-nums">
                {msToMinSec(duration)}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  } else {
    return <div></div>;
  }
}
