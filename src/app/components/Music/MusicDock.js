"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { readPauseOnBreaks } from "./preferences";
import { msToClock } from "./BrowserParts";

const Icon = ({ d, size = 18, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d={d}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PLAY = "M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z";
const PAUSE = "M6 4h4v16H6zM14 4h4v16h-4z";
const NEXT = "M5 5.5v13a1 1 0 0 0 1.55.83L16 13v5a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v5L6.55 4.67A1 1 0 0 0 5 5.5Z";
const PREV = "M19 5.5v13a1 1 0 0 1-1.55.83L8 13v5a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5l9.45-6.33A1 1 0 0 1 19 5.5Z";
const SHUFFLE = "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5";
const VOLUME = "M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13";
const MUTED = "M11 5 6 9H3v6h3l5 4V5ZM22 9l-6 6M16 9l6 6";
const HEART = "M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.4 4.5 6.9 4.5c2 0 3.6 1.2 5.1 3 1.5-1.8 3.1-3 5.1-3 3.5 0 5.4 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z";
const REPEAT = "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3";
const SPEAKER = "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 6h.01";

// Lists the account's devices and moves playback to the one picked
function DevicePicker({ music, name, className }) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState(null);
  const ref = useRef(null);
  const { listDevices, transferTo } = music;

  useEffect(() => {
    if (!open) return;
    setDevices(null);
    listDevices().then(setDevices).catch(() => setDevices([]));
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, listDevices]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose where music plays"
        aria-expanded={open}
        title="Devices"
        className={className}
      >
        <Icon d={SPEAKER} size={18} />
      </button>
      {open ? (
        <div className="sticker absolute bottom-full right-0 mb-4 w-72 bg-shell rounded-2xl p-2 z-[70]">
          <p className="px-2 pt-1 pb-2 font-bold">Play music on</p>
          {devices === null ? (
            <p className="px-2 pb-2 text-sm text-ink/60">Looking for devices…</p>
          ) : devices.length === 0 ? (
            <p className="px-2 pb-2 text-sm text-ink/60">
              No devices found. Open {name} on your phone or computer and it&apos;ll show up here.
            </p>
          ) : (
            devices.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  if (!d.is_active) transferTo(d.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-2 py-2 rounded-xl text-left cursor-pointer ${
                  d.is_active ? "bg-yolk" : "hover:bg-ink/10"
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold truncate">
                    {d.isThisTab ? "This tab" : d.name === "Peckodoro" ? "Another Peckodoro tab" : d.name}
                  </span>
                  <span className="block text-sm text-ink/60 capitalize">{d.type?.toLowerCase()}</span>
                </span>
                {d.is_active ? <span className="text-sm font-semibold shrink-0">Current</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

// Current position, advanced locally between the service's state updates
function useLivePosition(playback) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!playback || playback.paused) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [playback]);
  if (!playback) return 0;
  if (playback.paused) return playback.position;
  return Math.min(playback.duration, playback.position + (now - playback.updatedAt));
}

function Slider({ value, max, onChange, onCommit, label, disabled, className = "" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <input
      type="range"
      min={0}
      max={max || 1}
      step={max > 1 ? 1000 : 0.01}
      value={Math.min(value, max || 1)}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={(e) => onCommit?.(Number(e.currentTarget.value))}
      onKeyUp={(e) => onCommit?.(Number(e.currentTarget.value))}
      className={`slider ${className}`}
      style={{ "--pct": `${pct}%` }}
    />
  );
}

// The music bar along the bottom of the page. `music` is a service hook's result
// (useSpotify, useAppleMusic); `service` names it and supplies its logo and links.
export default function MusicDock({
  music,
  service,
  renderBrowser,
  mode = "Focus Time",
  browsing = false,
  setBrowsing,
}) {
  const { status, error, isHere, elsewhere, playback, volume, saved, reconnect } = music;
  const { name, Mark } = service;
  const reconnectLabel = service.reconnectLabel || `Reconnect ${name}`;
  // Pause for breaks, pick back up when focus starts (only what we paused ourselves)
  const prevMode = useRef(mode);
  const pausedForBreak = useRef(false);
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;
    if (!isHere) return;
    const onBreak = mode !== "Focus Time";
    // Read fresh each time since the toggle lives in Settings
    if (onBreak && readPauseOnBreaks() && playback && !playback.paused) {
      music.pause();
      pausedForBreak.current = true;
      toast("Music paused for your break", {
        description: "It'll start again when focus time does.",
      });
    } else if (!onBreak && pausedForBreak.current) {
      pausedForBreak.current = false;
      music.resume();
      toast("Music's back on for focus time");
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const [scrub, setScrub] = useState(null);
  const [lastVolume, setLastVolume] = useState(0.5);
  const closeBrowser = useCallback(() => setBrowsing(false), [setBrowsing]);
  // The page provides a slot in the side column for the music panel
  const [slot, setSlot] = useState(null);
  useEffect(() => setSlot(document.getElementById("side-panel")), []);

  const livePosition = useLivePosition(playback);
  const position = scrub ?? livePosition;
  const duration = playback?.duration || 0;
  const track = playback?.track;
  const art = track?.album?.images?.[0]?.url;
  const trackUrl = track ? service.trackUrl?.(track) : null;
  const canControl = status === "ready" && isHere && Boolean(track);

  let title = track?.name;
  let subtitle = track?.artists?.map((a) => a.name).join(", ");
  if (status === "connecting") {
    title = `Connecting to ${name}…`;
    subtitle = "";
  } else if (status === "error") {
    // Keep the title short; the full message can be long
    title = name;
    subtitle = error?.message;
  } else if (elsewhere) {
    subtitle = `Playing on ${elsewhere}`;
  } else if (!track) {
    title = "Nothing playing";
    subtitle = "Browse to pick something to study to";
  }

  const iconBtn =
    "w-9 h-9 rounded-full items-center justify-center cursor-pointer hover:bg-ink/10 disabled:opacity-35 disabled:cursor-default disabled:hover:bg-transparent transition-colors";

  return (
    <>
      {browsing && slot ? (
        createPortal(
        renderBrowser({
          onClose: closeBrowser,
          notice: (
            status === "ready" ? null : (
              <>
                <p className="font-semibold">
                  {status === "connecting" ? `Connecting to ${name}…` : error?.message}
                </p>
                {status === "error" && error?.canReconnect ? (
                  <button
                    type="button"
                    onClick={reconnect}
                    className="sticker-btn bg-yolk px-4 py-2 rounded-xl font-semibold cursor-pointer"
                  >
                    {reconnectLabel}
                  </button>
                ) : null}
              </>
            )
          ),
        }),
          slot
        )
      ) : null}

      <div className="relative w-full h-[var(--dock-h)] shrink-0 border-t-2 border-ink bg-surface text-ink px-3 md:px-6 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-3 md:gap-6">
        {/* Mobile progress along the top edge */}
        {duration ? (
          <div className="md:hidden absolute left-0 right-0 -top-[2px] h-[3px] bg-ink/10">
            <div className="h-full bg-beak" style={{ width: `${(position / duration) * 100}%` }} />
          </div>
        ) : null}

        {/* Now playing */}
        <div className="flex items-center gap-3 min-w-0">
          {art ? (
            <Image
              src={art}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="w-12 h-12 rounded-lg border-2 border-ink object-cover shrink-0"
            />
          ) : (
            <span className="w-12 h-12 rounded-lg border-2 border-ink bg-straw shrink-0 flex items-center justify-center">
              <Mark size={22} />
            </span>
          )}
          <div className="min-w-0">
            {trackUrl && status === "ready" ? (
              <a
                href={trackUrl}
                target="_blank"
                rel="noreferrer"
                className="block font-semibold truncate hover:underline underline-offset-2"
                title={`Open in ${name}`}
              >
                {title}
              </a>
            ) : (
              <p className="font-semibold truncate">{title}</p>
            )}
            {subtitle ? (
              <p className="text-sm text-ink/60 truncate" title={subtitle}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {saved !== null && track ? (
            <button
              type="button"
              onClick={music.toggleSaved}
              aria-label={saved ? "Remove from Liked Songs" : "Save to Liked Songs"}
              aria-pressed={saved}
              title={saved ? "Remove from Liked Songs" : "Save to Liked Songs"}
              className={`${iconBtn} flex shrink-0 ${saved ? "text-beak" : "text-ink/60"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d={HEART}
                  fill={saved ? "currentColor" : "none"}
                  stroke={saved ? "var(--ink)" : "currentColor"}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Transport + seek */}
        <div className="flex flex-col items-center justify-center gap-1 md:min-w-0">
          {elsewhere && !isHere ? (
            <button
              type="button"
              onClick={() => music.playHere(true)}
              className="sticker-btn bg-beak px-4 py-1.5 rounded-full font-bold text-sm cursor-pointer whitespace-nowrap"
            >
              Play here
            </button>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={music.toggleShuffle}
                disabled={!canControl}
                aria-label="Shuffle"
                aria-pressed={Boolean(playback?.shuffle)}
                className={`${iconBtn} hidden md:flex ${playback?.shuffle ? "text-beak" : ""}`}
              >
                <Icon d={SHUFFLE} size={16} />
              </button>
              <button type="button" onClick={music.previous} disabled={!canControl} aria-label="Previous track" className={`${iconBtn} hidden sm:flex`}>
                <Icon d={PREV} filled />
              </button>
              <button
                type="button"
                onClick={music.togglePlay}
                disabled={status !== "ready" || !track}
                aria-label={playback && !playback.paused && isHere ? "Pause" : "Play"}
                className="w-11 h-11 rounded-full bg-beak border-2 border-ink flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                <Icon d={playback && !playback.paused && isHere ? PAUSE : PLAY} filled size={16} />
              </button>
              <button type="button" onClick={music.next} disabled={!canControl} aria-label="Next track" className={`${iconBtn} flex`}>
                <Icon d={NEXT} filled />
              </button>
              <button
                type="button"
                onClick={music.cycleRepeat}
                disabled={!canControl}
                aria-label={`Repeat: ${
                  { off: "off", context: "all", track: "this song" }[playback?.repeat || "off"]
                }`}
                title="Repeat"
                className={`${iconBtn} hidden md:flex relative ${
                  playback?.repeat && playback.repeat !== "off" ? "text-beak" : ""
                }`}
              >
                <Icon d={REPEAT} size={16} />
                {playback?.repeat === "track" ? (
                  <span className="absolute top-0.5 right-0.5 text-[9px] font-bold leading-none text-ink">1</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => (error?.canReconnect ? reconnect() : setBrowsing((b) => !b))}
                disabled={status === "connecting" || (status === "error" && !error?.canReconnect)}
                aria-label={error?.canReconnect ? reconnectLabel : "Browse music"}
                className={`${iconBtn} flex md:hidden`}
              >
                <Mark size={22} />
              </button>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 w-full max-w-md text-xs text-ink/60 tabular-nums">
            <span className="w-9 text-right">{msToClock(position)}</span>
            <Slider
              value={position}
              max={duration}
              disabled={!canControl}
              label="Seek"
              onChange={setScrub}
              onCommit={(ms) => {
                music.seek(ms);
                setScrub(null);
              }}
              className="flex-1"
            />
            <span className="w-9">{msToClock(duration)}</span>
          </div>
        </div>

        {/* Volume + browse */}
        <div className="hidden md:flex items-center justify-end gap-3">
          {status === "ready" && music.listDevices ? (
            <DevicePicker music={music} name={name} className={`${iconBtn} flex`} />
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (volume > 0) {
                setLastVolume(volume);
                music.setVolume(0);
              } else music.setVolume(lastVolume || 0.5);
            }}
            aria-label={volume > 0 ? "Mute" : "Unmute"}
            className={`${iconBtn} flex`}
          >
            <Icon d={volume > 0 ? VOLUME : MUTED} size={18} />
          </button>
          <Slider value={volume} max={1} label="Volume" onChange={music.setVolume} className="w-24" />
          {status === "error" && error?.canReconnect ? (
            <button type="button" onClick={reconnect} className="sticker-btn bg-yolk px-3 py-2 rounded-xl font-semibold cursor-pointer whitespace-nowrap">
              {reconnectLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBrowsing((b) => !b)}
              disabled={status !== "ready"}
              aria-expanded={browsing}
              className="sticker-btn bg-shell px-3 py-2 rounded-xl font-semibold cursor-pointer flex lg:hidden items-center gap-2 whitespace-nowrap"
            >
              <Mark size={18} />
              Browse music
            </button>
          )}
        </div>

      </div>
    </>
  );
}
