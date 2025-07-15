"use client";
import { useEffect, useRef, useState } from "react";
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

function msToMinSec(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function SpotifyPlayer({ accessToken }) {
  const [player, setPlayer] = useState(null);
  const [device, setDevice] = useState(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(track);
  const deviceId = useRef(null);
  const [isCurrentDevice, setIsCurrentDevice] = useState(false);
  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);
  let testExpireAt = Date.now() + 10000;
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
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
            accessTokenRef.current = json.accessToken;
            console.log("Access token refreshed successfully.");
          } else {
            toast.error("Failed to refresh Spotify access token, please refresh the page.");
          }

          cb(accessTokenRef.current);
        },
        volume: 0.15,
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
          console.log("No player state available");
          setIsCurrentDevice(false);
          return;
        }

        setIsCurrentDevice(true);
        console.log(state);
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
          toast.error("Failed to refresh Spotify access token, please refresh the page.");
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
    activateDevices(accessTokenRef.current, [deviceId.current]);
  };

  useEffect(() => {
    console.log("Current Track:", current_track);
  }, [current_track]);

  const albumImg = current_track?.album?.images?.[0]?.url || "";
  const songName = current_track?.name || "Song Name";
  const artists = current_track?.artists?.map((a) => a.name).join(", ") || "Artist";
  const albumName = current_track?.album?.name || "Album";
  const posMs = typeof position === "number" ? position : 0;
  const totalMs = typeof duration === "number" ? duration : current_track?.duration_ms || 0;

  return (
    <div
      className="w-full bg-neutral-900 flex items-center px-6 py-4 justify-between relative"
      style={{ minHeight: 100 }}>
      {/* Left: Album Art & Track Info */}
      <div className="flex items-center w-[10rem]">
        <Link
          href={`https://open.spotify.com/track/${current_track.uri?.split(":").pop()}`}
          className="flex-shrink-0"
          target="_blank">
          <Image src={albumImg ? albumImg : "/window.svg"} alt={albumName} width={60} height={60} />
        </Link>

        <div className="ml-3 md:flex flex-col hidden">
          <span className="text-white text-sm font-semibold truncate max-w-[180px]">{songName}</span>
          <span className="text-neutral-300 text-xs truncate max-w-[180px]">{artists}</span>
          <span className="text-neutral-500 text-xs truncate max-w-[180px]">{albumName}</span>
        </div>
      </div>
      {/* Center: Controls & Progress */}
      <div className="flex flex-col items-center flex-1 w-full max-w-[960px] right-[50%]">
        <div className="flex items-center gap-6 mb-1 select-none">
          <button
            className="text-neutral-500 hover:text-white text-xl font-bold"
            title="Previous"
            onClick={() => {
              player.previousTrack();
            }}>
            ⏮️
          </button>
          <button
            className="text-neutral-500 hover:text-white text-2xl font-bold cursor-pointer"
            title="Play/Pause"
            onClick={async () => {
              await player.togglePlay();
              console.log("player");
            }}>
            {is_paused ? "▶️" : "⏸️"}
          </button>
          <button
            className="text-neutral-500 hover:text-white text-xl font-bold cursor-pointer"
            title="Next"
            onClick={() => {
              player.nextTrack();
            }}>
            ⏭️
          </button>
        </div>
        <div className="w-[70%] flex items-center gap-2">
          <span className="text-xs text-neutral-400 min-w-[30px]">{msToMinSec(posMs)}</span>
          <div className="h-1 rounded bg-neutral-700 flex-1 relative overflow-hidden cursor-pointer">
            <div
              className="absolute h-1 rounded bg-neutral-400"
              style={{ width: `${(posMs / totalMs) * 100 || 0}%` }}></div>
          </div>
          <span className="text-xs text-neutral-400 min-w-[30px]">{msToMinSec(totalMs)}</span>
        </div>
      </div>
      {/* Right: Device Info / Return Control */}
      <div className="md:flex flex-col items-end hidden">
        <span className="text-xs text-neutral-400 mb-2">
          {isCurrentDevice ? "Listening on Peckodoro" : "Playback Elsewhere"}
        </span>
        {!isCurrentDevice ? (
          <button className="bg-green-500 text-white px-3 py-1 rounded text-xs" onClick={swithBackToPlayer}>
            Return Playback
          </button>
        ) : null}
      </div>
    </div>
  );
}
