"use client";
import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";

const Timer = (props) => {
  const { settings, onModeChange } = props;
  const focusDone = useRef(0);
  const sequenceSet = useRef(false);
  const [currentMode, setCurrentMode] = useState("Focus Time"); // default to focus
  const [min, setMinutes] = useState(settings.focusTime);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(min * 60 * 1000); // minutes to seconds
  const timerRef = useRef(null);
  const laspe = useRef(null);
  const startTimeRef = useRef(null);
  const [playAlarm, setPlayAlarm] = useState(true);
  const [roundsDone, setRoundsDone] = useState(0);

  useEffect(() => {
    const currentMinutes = getCurrentModeMinutes();
    const newDuration = currentMinutes * 60 * 1000;
    if (Math.max(0, newDuration - laspe.current) == 0) {
      if (playAlarm) playSound();
      resetTimer();
    }

    const didDurationChange =
      Math.abs(timeLeft - newDuration) > 100 ||
      Math.abs(timeLeft - newDuration) < 100;

    if (didDurationChange && startTimeRef.current && isRunning) {
      pauseTimer();
      setTimeLeft(Math.max(0, newDuration - laspe.current));
    } else {
      setTimeLeft(newDuration);
    }
  }, [
    currentMode === "Focus Time" ? settings.focusTime : null,
    currentMode === "Short Break" ? settings.shortBreak : null,
    currentMode === "Long Break" ? settings.longBreak : null,
  ]);

  const getCurrentModeMinutes = () => {
    switch (currentMode) {
      case "Short Break":
        return settings.shortBreak;
      case "Long Break":
        return settings.longBreak;
      case "Focus Time":
      default:
        return settings.focusTime;
    }
  };

  useEffect(() => {
    if (sequenceSet.current) {
      return;
    }
    sequenceSet.current = true;
    changeMode("Focus Time");
  }, []);

  useEffect(() => {
    laspe.current += 300;
    const min = Math.floor(timeLeft / 60000);
    const sec = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0");
    document.title = `${min}:${sec} – ${currentMode}`;
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (playAlarm) playSound();
      setTimeout(() => {
        resetTimer();
      }, 300);
    }
  }, [timeLeft]);

  useEffect(() => {
    laspe.current = null;
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    const minutes = getCurrentModeMinutes();
    setMinutes(minutes);
    setTimeLeft(minutes * 60 * 1000);
    if (settings.autoStart) {
      setIsRunning(true);
    }

    if (currentMode === "Long Break") focusDone.current = 0;
    setRoundsDone(focusDone.current);
    onModeChange?.(currentMode);
  }, [currentMode]);

  useEffect(() => {
    if (!isRunning) return;

    const duration = getCurrentModeMinutes() * 60 * 1000;
    startTimeRef.current = Date.now() - (duration - timeLeft);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const totalDuration = getCurrentModeMinutes() * 60 * 1000;
      const remaining = Math.max(totalDuration - elapsed, 0);
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const getNextMode = () => {
    if (currentMode === "Focus Time") focusDone.current++;

    if (focusDone.current >= settings.focusBeforeLong) {
      return "Long Break";
    }
    return currentMode === "Focus Time" ? "Short Break" : "Focus Time";
  };

  const resetTimer = () => {
    laspe.current = null;
    const next = getNextMode();
    if (next === "Long Break") focusDone.current = 0;
    setCurrentMode(next);
  };

  const pauseTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const continueTimer = () => {
    const duration = getCurrentModeMinutes() * 60 * 1000;
    startTimeRef.current = Date.now() - (duration - timeLeft);
    setIsRunning(true);
  };

  const [playSound] = useSound("/alarm1.mp3", {
    volume: 1,
  });

  const changeMode = (newMode) => {
    setCurrentMode(newMode);
  };

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  const modes = ["Focus Time", "Short Break", "Long Break"];
  const totalRounds = Math.min(Math.max(settings.focusBeforeLong || 1, 1), 12);
  const filledRounds =
    currentMode === "Long Break"
      ? totalRounds
      : Math.min(roundsDone, totalRounds);
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
        className="sticker flex rounded-full bg-shell p-1 text-sm md:text-base font-semibold"
      >
        {modes.map((mode) => (
          <button
            key={mode}
            role="tab"
            aria-selected={currentMode === mode}
            onClick={() => changeMode(mode)}
            className={`px-3 md:px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
              currentMode === mode
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
        className={`sticker-btn min-w-48 px-10 py-3 rounded-full text-xl font-bold cursor-pointer ${
          isRunning ? "bg-shell text-ink" : "bg-beak text-ink"
        }`}
      >
        {isRunning ? "Pause" : !timerRef.current ? "Start" : "Continue"}
      </button>
    </div>
  );
};

export default Timer;
