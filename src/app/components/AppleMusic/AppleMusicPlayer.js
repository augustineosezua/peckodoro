"use client";
import MusicDock from "../Music/MusicDock";
import { useAppleMusic } from "./useAppleMusic";
import AppleMusicBrowser, { AppleMusicMark } from "./AppleMusicBrowser";

const SERVICE = {
  name: "Apple Music",
  Mark: AppleMusicMark,
  trackUrl: (track) => track.url || null,
};

export default function AppleMusicPlayer(props) {
  const music = useAppleMusic();
  return (
    <MusicDock
      {...props}
      music={music}
      service={SERVICE}
      renderBrowser={(browserProps) => <AppleMusicBrowser music={music} {...browserProps} />}
    />
  );
}
