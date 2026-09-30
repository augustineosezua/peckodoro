"use client";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import {
  MODES,
  addTime,
  focusPerCycle,
  formatClock,
  isRunning,
  newRound,
  nextRound,
  overdueBy,
  pause,
  readRound,
  resume,
  timeLeft,
} from "./clock";

const STORAGE_KEY = "peckodoro-timer";
// Only ring for a round that ended just now, not one that ran out while the tab was closed
const ALARM_GRACE = 3000;
const ADD_STEP = 60 * 1000;

function readSaved() {
  try {
    return readRound(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return null;
  }
}

const Timer = (props) => {
  // ready: settings are the user's real ones, so an overdue round can be finished
  const { settings, onModeChange, ready = true } = props;
  const [round, setRound] = useState(() => newRound("Focus Time", 0));
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(0);

  const running = isRunning(round);
  const left = timeLeft(round, settings, now);
  const { minutes, seconds, text: clock } = formatClock(left);

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

  // Another tab started, paused or skipped: follow it so both show the same clock.
  // Writing back the same round doesn't fire another storage event, so this can't ping-pong.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const saved = readRound(JSON.parse(e.newValue));
        if (!saved) return;
        setNow(Date.now());
        setRound(saved);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    onModeChange?.(round.mode);
  }, [round.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = `${clock} – ${round.mode}`;
  }, [clock, round.mode]);

  // Round over: move on to the next mode
  useEffect(() => {
    if (!loaded || !ready || !running || left > 0) return;
    const at = Date.now();
    if (overdueBy(round, settings, at) < ALARM_GRACE) playSound();
    setNow(at);
    setRound(nextRound(round, settings, at));
  }, [left, running, loaded, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const pauseTimer = () => {
    const at = Date.now();
    setNow(at);
    setRound((r) => pause(r, at));
  };

  const continueTimer = () => {
    const at = Date.now();
    setNow(at);
    setRound((r) => resume(r, at));
  };

  const skipRound = () => {
    const at = Date.now();
    setNow(at);
    setRound((r) => nextRound(r, settings, at));
  };

  const addMinute = () => setRound((r) => addTime(r, ADD_STEP));

  const changeMode = (newMode) => {
    if (newMode === round.mode) return;
    const at = Date.now();
    setNow(at);
    setRound(
      newRound(
        newMode,
        newMode === "Long Break" ? 0 : round.focusDone,
        settings.autoStart ? at : null
      )
    );
  };

  const totalRounds = Math.min(focusPerCycle(settings), 12);
  const filledRounds =
    round.mode === "Long Break"
      ? totalRounds
      : Math.min(round.focusDone, totalRounds);
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

      <div className="flex items-center gap-3 sm:gap-4" data-tour="start">
        <button
          onClick={addMinute}
          aria-label="Add one minute"
          className="sticker-btn bg-shell text-ink px-4 py-2 rounded-full text-sm font-bold cursor-pointer"
        >
          +1 min
        </button>
        <button
          onClick={running ? pauseTimer : continueTimer}
          className={`sticker-btn min-w-36 sm:min-w-48 px-8 sm:px-10 py-3 rounded-full text-xl font-bold cursor-pointer ${
            running ? "bg-shell text-ink" : "bg-beak text-ink"
          }`}
        >
          {running ? "Pause" : round.banked > 0 ? "Continue" : "Start"}
        </button>
        <button
          onClick={skipRound}
          aria-label={`Skip ${round.mode}`}
          className="sticker-btn bg-shell text-ink px-4 py-2 rounded-full text-sm font-bold cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default Timer;
