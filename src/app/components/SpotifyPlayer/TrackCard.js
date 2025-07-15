import React from "react";

function msToMinSec(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackCard({ track }) {
  const albumImg = track.album.images[0]?.url;
  const artists = track.artists.map((a, i) => (
    <a
      key={a.uri}
      href={`https://open.spotify.com/artist/${a.uri.split(":").pop()}`}
      className="hover:underline font-medium text-neutral-900 dark:text-white"
      target="_blank"
      rel="noopener noreferrer"
    >
      {a.name}
      {i < track.artists.length - 1 && (
        <span className="mx-1 text-neutral-500">,</span>
      )}
    </a>
  ));

  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-lg flex items-center gap-4 p-4">
      <img
        src={albumImg}
        alt={track.album.name}
        className="w-24 h-24 rounded-xl object-cover shadow-md"
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="truncate text-xl font-bold text-neutral-900 dark:text-white">
          {track.name}
        </div>
        <div className="truncate text-base mb-1">{artists}</div>
        <div className="text-sm text-neutral-500 truncate">
          <span>Album: </span>
          <a
            href={`https://open.spotify.com/album/${track.album.uri.split(":").pop()}`}
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {track.album.name}
          </a>
        </div>
        <div className="text-xs text-neutral-400 mt-2">
          {msToMinSec(track.duration_ms)}
        </div>
      </div>
    </div>
  );
}
