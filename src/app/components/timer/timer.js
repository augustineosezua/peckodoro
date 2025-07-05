"use client";
import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";

const Timer = (props) => {
  const { settings } = props;
  const focusDone = useRef(0);
  const sequenceSet = useRef(false);
  const [currentMode, setCurrentMode] = useState(); // default to focus
  const [min, setMinutes] = useState(settings.focusTime);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(min * 60 * 1000); // minutes to seconds
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [playAlarm, setPlayAlarm] = useState(true);

  useEffect(() => {
    let currentSettingMinutes = getCurrentModeMinutes();
    const newTime = currentSettingMinutes * 60 * 1000;

    // Only update timeLeft if the current mode was affected
    if (timeLeft > newTime || !isRunning) {
      setMinutes(currentSettingMinutes);
      setTimeLeft(newTime);
    }

    if (isRunning) {
      pauseTimer();
      continueTimer();
    }
  }, [settings.focusTime, settings.shortBreak, settings.longBreak]);

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
    const min = Math.floor(timeLeft / 60000);
    const sec = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0");
    document.title = `${min}:${sec} – ${currentMode}`;
  }, [timeLeft, currentMode]);

  useEffect(() => {
    document.title = `Peckodoro - ${currentMode}`
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

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (playAlarm) playSound();
      setTimeout(() => {
        resetTimer();
      }, 300);
    }
  }, [timeLeft]);

  const getNextMode = () => {
    if (currentMode === "Focus Time") focusDone.current++;

    if (focusDone.current >= settings.focusBeforeLong) {
      return "Long Break";
    }
    return currentMode === "Focus Time" ? "Short Break" : "Focus Time";
  };

  const resetTimer = () => {
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

  return (
    <div className="w-full flex-col flex justify-center items-center  font-[family-name:var(--font-chivo-mono)] pt-5 grow">
      <div className="flex md:gap-4 px-2 text-center">
        <div
          className={`px-4 py-2 cursor-pointer rounded-lg ${
            currentMode == "Focus Time" ? "bg-[#E9CBA7]" : ""
          }`}
          onClick={() => changeMode("Focus Time")}
        >
          Focus Time
        </div>
        <div
          className={`px-4 py-2 cursor-pointer rounded-lg ${
            currentMode == "Short Break" ? "bg-[#E9CBA7]" : ""
          }`}
          onClick={() => changeMode("Short Break")}
        >
          Short Break
        </div>
        <div
          className={`px-4 py-2 cursor-pointer rounded-lg ${
            currentMode == "Long Break" ? "bg-[#E9CBA7]" : ""
          }`}
          onClick={() => changeMode("Long Break")}
        >
          Long Break
        </div>
      </div>
      <div className="md:text-9xl text-8xl font-bold cursor-default px-2 w-full flex justify-center">
        {minutes}:{seconds}
      </div>
      <div className="py-3">
        <button
          onClick={!isRunning ? continueTimer : pauseTimer}
          className={`px-14 py-2 rounded-lg shadow-md text-lg cursor-pointer ${
            isRunning ? "bg-[#C86B5A] text-white " : "bg-[#F4A261]"
          }`}
        >
          {isRunning ? "Pause" : !timerRef.current ? "Start" : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Timer;
