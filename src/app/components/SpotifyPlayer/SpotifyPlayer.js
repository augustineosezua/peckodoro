"use client";
import MusicDock from "../Music/MusicDock";
import { useSpotify } from "./useSpotify";
import MusicBrowser, { SpotifyMark } from "./MusicBrowser";

const SERVICE = {
  name: "Spotify",
  Mark: SpotifyMark,
  trackUrl: (track) => {
    const id = track.id || track.uri?.split(":").pop();
    return id ? `https://open.spotify.com/track/${id}` : null;
  },
};

export default function SpotifyPlayer(props) {
  const spotify = useSpotify();
  return (
    <MusicDock
      {...props}
      music={spotify}
      service={SERVICE}
      renderBrowser={(browserProps) => <MusicBrowser spotify={spotify} {...browserProps} />}
    />
  );
}
