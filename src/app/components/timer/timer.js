"use client";
import { useEffect, useState } from "react";
import useSound from "use-sound";

const STORAGE_KEY = "peckodoro-timer";
const MODES = ["Focus Time", "Short Break", "Long Break"];
// Only ring for a round that ended just now, not one that ran out while the tab was closed
const ALARM_GRACE = 3000;

const minutesFor = (mode, settings) => {
  switch (mode) {
    case "Short Break":
      return settings.shortBreak;
    case "Long Break":
      return settings.longBreak;
    case "Focus Time":
    default:
      return settings.focusTime;
  }
};

// The round is stored as time banked while paused plus when it was last started,
// so the clock is worked out from timestamps and survives reloads and sleeping tabs
const freshRound = (mode, focusDone, autoStart) => ({
  mode,
  focusDone,
  banked: 0,
  startedAt: autoStart ? Date.now() : null,
});

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && MODES.includes(saved.mode)) return saved;
  } catch {}
  return null;
}

const Timer = (props) => {
  // ready: settings are the user's real ones, so an overdue round can be finished
  const { settings, onModeChange, ready = true } = props;
  const [round, setRound] = useState(() => freshRound("Focus Time", 0, false));
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(0);

  const isRunning = round.startedAt !== null;
  const elapsed =
    round.banked + (isRunning ? Math.max(0, now - round.startedAt) : 0);
  const duration = minutesFor(round.mode, settings) * 60 * 1000;
  const timeLeft = Math.max(0, duration - elapsed);

  const [playSound] = useSound("/alarm1.mp3", {
    volume: 1,
  });

  useEffect(() => {
    const saved = readSaved();
    if (saved) setRound(saved);
    setNow(Date.now());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(round));
    } catch {}
  }, [round, loaded]);

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    onModeChange?.(round.mode);
  }, [round.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  useEffect(() => {
    document.title = `${minutes}:${seconds} – ${round.mode}`;
  }, [minutes, seconds, round.mode]);

  const startRound = (mode, focusDone) => {
    setRound(freshRound(mode, focusDone, settings.autoStart));
  };

  // Round over: move on to the next mode
  useEffect(() => {
    if (!loaded || !ready || !isRunning || timeLeft > 0) return;
    if (elapsed - duration < ALARM_GRACE) playSound();

    let focusDone = round.focusDone;
    if (round.mode === "Focus Time") focusDone++;
    let next = round.mode === "Focus Time" ? "Short Break" : "Focus Time";
    if (focusDone >= settings.focusBeforeLong) {
      next = "Long Break";
      focusDone = 0;
    }
    startRound(next, focusDone);
  }, [timeLeft, isRunning, loaded, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const pauseTimer = () => {
    setRound((r) =>
      r.startedAt === null
        ? r
        : { ...r, banked: r.banked + (Date.now() - r.startedAt), startedAt: null }
    );
  };

  const continueTimer = () => {
    const at = Date.now();
    setNow(at);
    setRound((r) => (r.startedAt === null ? { ...r, startedAt: at } : r));
  };

  const changeMode = (newMode) => {
    if (newMode === round.mode) return;
    startRound(newMode, newMode === "Long Break" ? 0 : round.focusDone);
  };

  const totalRounds = Math.min(Math.max(settings.focusBeforeLong || 1, 1), 12);
  const filledRounds =
    round.mode === "Long Break"
      ? totalRounds
      : Math.min(round.focusDone, totalRounds);
  const clock = `${minutes}:${seconds}`;
  const digits = clock.split("").map((ch, i) => (
    <span key={i} className={ch === ":" ? "clock-colon" : "clock-digit"}>
      {ch}
    </span>
  ));

  return (
    <div className="w-full flex-col flex justify-center items-center pt-6 md:pt-10 grow">
      <div
        role="tablist"
        aria-label="Timer mode"
        data-tour="modes"
        className="sticker flex rounded-full bg-shell p-1 text-sm md:text-base font-semibold"
      >
        {MODES.map((mode) => (
          <button
            key={mode}
            role="tab"
            aria-selected={round.mode === mode}
            onClick={() => changeMode(mode)}
            className={`px-3 md:px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
              round.mode === mode
                ? "bg-ink text-shell"
                : "text-ink/70 hover:text-ink hover:bg-straw"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Sized so the clock still fits when the assistant dock is open */}
      <div
        className="font-[family-name:var(--font-display)] font-extrabold leading-none tracking-tight cursor-default text-[4.5rem] sm:text-[7rem] md:text-[8.5rem] xl:text-[10.5rem] pt-4 pb-2 select-none"
        role="timer"
        aria-label={`${minutes} minutes ${seconds} seconds left`}
      >
        {digits}
      </div>

      <div
        className="flex items-center gap-2 pb-6"
        data-tour="rounds"
        aria-label={`${filledRounds} of ${totalRounds} focus sessions done before the long break`}
      >
        {Array.from({ length: totalRounds }).map((_, i) => (
          <span
            key={i}
            className={`block w-4 h-5 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-2 ${
              i < filledRounds
                ? "bg-yolk border-ink"
                : "bg-ink/15 border-transparent"
            }`}
          />
        ))}
      </div>

      <button
        onClick={!isRunning ? continueTimer : pauseTimer}
        data-tour="start"
        className={`sticker-btn min-w-48 px-10 py-3 rounded-full text-xl font-bold cursor-pointer ${
          isRunning ? "bg-shell text-ink" : "bg-beak text-ink"
        }`}
      >
        {isRunning ? "Pause" : round.banked > 0 ? "Continue" : "Start"}
      </button>
    </div>
  );
};

export default Timer;
