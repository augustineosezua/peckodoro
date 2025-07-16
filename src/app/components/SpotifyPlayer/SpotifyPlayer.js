"use client";
import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

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
  const [player, setPlayer] = useState(null);
  const currentTrack = useRef(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(track);
  const [position, setPosition] = useState(0);
  const positionRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const deviceId = useRef(null);
  const [isCurrentDevice, setIsCurrentDevice] = useState(false);
  const accessTokenRef = useRef(null);
  const [volume, setNewVolume] = useState(0.15);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Peckodoro",
        getOAuthToken: async (cb) => {
          console.log(session);
          const response = await fetch("/api/spotify/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: session.user.id }),
          });
          const json = await response.json();
          if (json.accessToken) {
            accessTokenRef.current = json.accessToken;
            console.log("Access token refreshed successfully.");
          } else {
            toast.error(
              "Failed to refresh Spotify access token, please refresh the page."
            );
          }

          cb(accessTokenRef.current);
        },
        volume: 0.15,
        enableMediaSession: true,
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
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
      player.addListener("authentication_error", async () => {
        console.warn("Authentication error, refreshing token...");
        const response = await fetch("/api/spotify/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const json = await response.json();
        if (json.accessToken) {
          accessTokenRef.current = json.accessToken;
          console.log("Access token refreshed successfully.");
        } else {
          toast.error(
            "Failed to refresh Spotify access token, please refresh the page."
          );
        }
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
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessTokenRef.current}`,
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
      console.log("Playback transferred!");
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
  }, [current_track]);

  const handleVolumeChange = async (e) => {
    const newVolume = parseFloat(e.target.value);
    setNewVolume(newVolume);
    await player.setVolume(newVolume);
  };

  useEffect(() => {
    if (!play && player) {
      document.body.removeChild(script);
      if (player) {
        player.disconnect();
      }
    }
  }, [play]);

  const albumImg = current_track?.album?.images?.[0]?.url || "";
  const songName = current_track?.name || "Song Name";
  const artists =
    current_track?.artists?.map((a) => a.name).join(", ") || "Artist";
  const albumName = current_track?.album?.name || "Album";

  if (play) {
    return (
      <div
        className="w-full bg-neutral-900 flex items-center px-6 py-4 justify-between relative font-[family-name:var(--font-geist-sans)] text-xl"
        style={{ minHeight: 100 }}
      >
        {/* Left: Album Art & Track Info */}
        <div className="flex items-center w-[10rem]">
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
        <div className="flex flex-col items-center flex-1 w-full h-full justify-between py-1 max-w-[960px] right-[50%]">
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
                console.log("player");
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
        <div className="md:flex flex-col items-center justify-between hidden gap-3">
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
          {!isCurrentDevice ? (
            <button
              className="bg-green-500 text-white px-3 py-1 rounded text-xs cursor-pointer"
              onClick={swithBackToPlayer}
            >
              Return Playback
            </button>
          ) : null}
        </div>
      </div>
    );
  } else {
    return <div></div>;
  }
}
