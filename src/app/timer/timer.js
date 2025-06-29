"use client";
import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";

const Timer = () => {
  const modes = ["Short Break", "Focus Time", "Long Break"];
  const [currentMode, setCurrentMode] = useState("Focus Time"); // default to focus
  const [min, setMinutes] = useState(25);
  const [duration, setDuration] = useState(min * 60 * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration); // minutes to seconds
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [playAlarm, setPlayAlarm] = useState(true);

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    if (currentMode == "Short Break") {
      setMinutes(5);
      setTimeLeft(5 * 60 * 1000);
      setDuration(5 * 60 * 1000);
    }
    if (currentMode == "Long Break") {
      setMinutes(15);
      setTimeLeft(15 * 60 * 1000);
      setDuration(15 * 60 * 1000);
    }
    if (currentMode == "Focus Time") {
      setMinutes(25);
      setTimeLeft(25 * 60 * 1000);
      setDuration(25 * 60 * 1000);
    }
  }, [currentMode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(duration - elapsed, 0);
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(timerRef.current);
          if (playAlarm) {
            playSound();
          }
          resetTimer();
        }
      }, 100);

      return () => {
        clearInterval(timerRef.current);
      };
    }
  }, [isRunning]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    timerRef.current = null;
    setTimeLeft(duration);
  };

  const pauseTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const continueTimer = () => {
    startTimeRef.current = Date.now();
    if (timerRef.current) {
      startTimeRef.current = Date.now() - (duration - timeLeft);
    }
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
    <div className="w-full flex-col flex justify-center items-center font-[family-name:var(--font-geist-sans)] pt-5 grow">
      <div className="flex md:gap-4 px-2">
        <button
          className=" px-4 py-2 rounded-full cursor-pointer"
          onClick={() => changeMode("Short Break")}
        >
          Short Break
        </button>
        <button
          className="px-4 py-2 rounded-full cursor-pointer"
          onClick={() => changeMode("Focus Time")}
        >
          Focus Time
        </button>
        <button
          className="px-4 py-2 rounded-full cursor-pointer"
          onClick={() => {
            changeMode("Long Break");
          }}
        >
          Long Break
        </button>
      </div>
      <div className="md:text-9xl text-8xl font-bold cursor-default px-2">
        {minutes}:{seconds}
      </div>
      <div className="py-3">
        <button
          onClick={!isRunning ? continueTimer : pauseTimer}
          className={`px-14 py-2 rounded-lg shadow-md text-lg cursor-pointer ${
            isRunning ? "bg-[#C86B5A] text-white " : "bg-[#F4A261]"
          }`}
        >
          {isRunning ? "Pause" : !timerRef.current ? "Start" : "Contiune"}
        </button>
      </div>
    </div>
  );
};

export default Timer;
