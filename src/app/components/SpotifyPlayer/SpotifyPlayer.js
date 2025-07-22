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

    document.body.addEventListener("click", handleBodyClick);

    return () => {
      document.body.removeEventListener("click", handleBodyClick);
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
            className="w-screen h-[80vh] lg:h-[60dvh] bg-black text-white flex gap-6 p-4 pt-10 spofity-related rounded-t-2xl"
            id="spotify-player-controls"
          >
            <div className="bg-[#121212] w-1/2 overflow-y-auto py-4 px-2 rounded-2xl scrollbar-hide">
              <span
                className="text-white text-lg font-semibold block mb-3"
                style={{ cursor: "pointer" }}
              >
                Your Library
              </span>
              {playlists.items.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => setPlaylist(playlist.id)}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#232323] cursor-pointer transition"
                >
                  <img
                    src={
                      playlist.images && playlist.images.length > 0
                        ? playlist.images[0].url
                        : "/window.svg"
                    }
                    alt={playlist.name}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-semibold truncate">
                      {playlist.name}
                    </span>
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      Playlist
                      <span className="mx-1 text-neutral-400">•</span>
                      <span className="text-neutral-400">
                        {playlist.owner.display_name}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full overflow-hidden h-full bg-[#121212] rounded-2xl grow spofity-related">
              {showPlaylist ? (
                <div className="bg-[#121212] w-full px-2 py-2 h-full">
                  <div className="flex justify-between">
                    <div
                      onClick={() => {
                        playPlaylist();
                      }}
                    >
                      Shuffle Play
                    </div>
                    <div
                      className="cursor-pointer "
                      onClick={() => {
                        setShowPlaylist(false);
                      }}
                    >
                      {" "}
                      x
                    </div>
                  </div>

                  <span className="text-white text-lg font-semibold mb-4 block">
                    {currentPlaylist.name}
                  </span>
                  {currentPlaylist.tracks.items.map(({ track }, i) => (
                    <div
                      key={track.id || Date.now() + i}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#232323] cursor-pointer transition group"
                      onClick={() => {
                        playPlaylist(i);
                      }}
                    >
                      {/* Album Art */}
                      <img
                        src={
                          track.album.images && track.album.images.length > 0
                            ? track.album.images[0].url
                            : "/window.svg"
                        }
                        alt={track.name}
                        className="w-10 h-10 rounded-md object-cover"
                      />
                      <div className="flex flex-col min-w-0">
                        {/* Track name */}
                        <span className="text-white text-sm font-semibold truncate">
                          {i + 1}. {track.name}
                        </span>
                        {/* Artists and Album */}
                        <span className="text-neutral-400 text-xs truncate">
                          {track.artists.map((a) => a.name).join(", ")}
                          <span className="mx-1 text-neutral-600">•</span>
                          {track.album.name}
                        </span>
                      </div>
                      {/* Explicit label */}
                      {track.explicit && (
                        <span className="text-xs text-neutral-400 bg-neutral-700 px-1 rounded ml-2">
                          E
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-300 h-full flex flex-col items-center pt-10 overflow-y-auto rounded-lg p-4 scrollbar-hide w-full grow">
                  <form
                    onSubmit={(e) => handleSearch(e)}
                    className="w-full flex justify-center"
                  >
                    <div className="mb-6 w-full">
                      <div className="flex items-center gap-2 bg-[#242424] focus-within:bg-[#2a2a2a] transition-colors rounded-full pl-4 pr-3 h-12 ring-1 ring-transparent focus-within:ring-[#3a3a3a] ">
                        <svg className="w-5 h-5 text-[#a7a7a7]" /* ... */ />
                        <input
                          className="bg-transparent flex-1 outline-none text-sm placeholder-[#6a6a6a] focus:outline-green-500"
                          placeholder="What do you want to play?"
                        />
                      </div>
                    </div>
                  </form>
                  <div className="w-full h-full ">
                    <SpotifySearch
                      data={data}
                      accessToken={accessToken}
                      setQueue={setQueue}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="w-1/2 h-full bg-[#121212] rounded-2xl p-4 overflow-y-auto scrollbar-hide spofity-related">
              Your Queue
              {queue ? (
                <div className="h-full rounded-2xl ">
                  {queue && queue.length > 0 ? (
                    queue.map((item, index) => (
                      <div
                        key={item.id + index || index + Date.now()}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232323] transition"
                      >
                        <img
                          src={item.album.images[0]?.url || "/window.svg"}
                          alt={item.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-white text-sm font-semibold truncate">
                            {item.name}
                          </span>
                          <span className="text-neutral-400 text-xs truncate">
                            {item.artists.map((a) => a.name).join(", ")} -{" "}
                            {item.album.name}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 text-center">
                      No tracks in queue
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-neutral-500">No tracks in queue</p>
              )}
            </div>
          </div>
        ) : null}
        <div
          className="w-full bg-black flex items-center px-6 py-4 justify-between relative font-[family-name:var(--font-geist-sans)] text-xl spofity-related"
          style={{ minHeight: 100 }}
        >
          {/* Left: Album Art & Track Info */}
          <div className="flex items-center w-[10rem] spofity-related">
            <Link
              href={`https://open.spotify.com/track/${current_track.uri?.split(":").pop()}`}
              className="flex-shrink-0"
              target="_blank"
            >
              <Image
                src={albumImg ? albumImg : "/window.svg"}
                alt={albumName}
                width={60}
                height={60}
              />
            </Link>

            <div className="ml-3 md:flex flex-col hidden">
              <span className="text-white text-base font-semibold truncate max-w-[180px]">
                {songName}
              </span>
              <span className="text-neutral-300 text-xs truncate max-w-[180px]">
                {artists}
              </span>
              <span className="text-neutral-500 text-xs truncate max-w-[180px]">
                {albumName}
              </span>
            </div>
          </div>
          {/* Center: Controls & Progress */}
          <div className="flex flex-col items-center flex-1 w-full h-full justify-between py-1 max-w-[960px] right-[50%] spofity-related">
            <div className="flex items-center gap-6 mb-1 select-none">
              <button
                className="text-neutral-500 hover:text-white text-xl cursor-pointer"
                title="Previous"
                onClick={() => {
                  player.previousTrack();
                }}
              >
                {prevButton}
              </button>
              <button
                className="text-neutral-500 hover:text-white text-2xl font-bold cursor-pointer"
                title="Play/Pause"
                onClick={async () => {
                  await player.togglePlay();
                }}
              >
                {is_paused ? playButton : pauseButton}
              </button>
              <button
                className="text-neutral-500 hover:text-white text-xl font-bold cursor-pointer"
                title="Next"
                onClick={() => {
                  player.nextTrack();
                }}
              >
                {nextButton}
              </button>
            </div>
            <div className="w-[70%] flex items-center gap-2">
              <span className="text-xs text-neutral-400 min-w-[30px]">
                {msToMinSec(position)}
              </span>
              <div className="h-1 rounded bg-neutral-700 flex-1 relative overflow-hidden cursor-pointer">
                <div
                  className="absolute h-1 rounded bg-green-500"
                  style={{ width: `${(position / duration) * 100 || 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-neutral-400 min-w-[30px]">
                {msToMinSec(duration)}
              </span>
            </div>
          </div>
          {/* Right: Device Info / Return Control */}
          <div className="md:flex items-center justify-between hidden gap-3 spofity-related">
            {!isCurrentDevice ? (
              <button
                className="bg-green-500 text-white px-3 py-1 rounded text-xs cursor-pointer"
                onClick={swithBackToPlayer}
              >
                Play On Peckodoro
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-col text-white cursor-pointer">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg"
                  alt="Spotify Logo"
                  className="w-24 h-auto"
                  onClick={() => setShowControls(!showControls)}
                />
              </div>
            )}
            <div className="flex items-center w-36">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-[#1DB954] h-2 rounded-lg outline-none transition-all duration-200 shadow-inner hover:accent-[#1ED760]"
                aria-label="Volume"
              />
              <span className="ml-2 text-sm text-white">
                {Math.round(volume * 100)}
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
