"use client";
import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";

function sequenceSetter() {
  let sequence = [];
  let rounds = 2;
  for (let i = 0; i < rounds; i++) {
    sequence = [...sequence, "Focus Time", "Short Break"];
  }
  sequence = [...sequence, "Long Break"];
  return sequence;
}
const ogSequence = sequenceSetter();
const Timer = () => {
  const sequence = useRef(ogSequence);
  const [currentMode, setCurrentMode] = useState("Focus Time"); // default to focus
  const [min, setMinutes] = useState(25);
  const duration = min * 60 * 1000;
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration); // minutes to seconds
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [playAlarm, setPlayAlarm] = useState(true);

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    let minutes;
    switch (currentMode) {
      case "Short Break":
        minutes = 5;
        break;
      case "Long Break":
        minutes = 15;
        break;
      case "Focus Time":
      default:
        minutes = 25;
        break;
    }
    setMinutes(minutes);
    setTimeLeft(minutes * 60 * 1000);
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

  const getNextMode = () => {
    const currentIndex = sequence.current.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % sequence.current.length;
    setCurrentMode(sequence.current[nextIndex]);
    setTimeLeft(duration);
    sequence.current = [
      ...sequence.current.slice(0, currentIndex),
      ...sequence.current.slice(currentIndex + 1),
    ];
    if (sequence.current.length == 0) {
      sequence.current = sequenceSetter();
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    getNextMode();
    timerRef.current = null;
  };

  const pauseTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const continueTimer = () => {
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
    <div className="w-full flex-col flex justify-center items-center font-[family-name:var(--font-geist-sans)] pt-5 grow">
      <div className="flex md:gap-4 px-2">
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
            currentMode == "Focus Time" ? "bg-[#E9CBA7]" : ""
          }`}
          onClick={() => changeMode("Focus Time")}
        >
          Focus Time
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
          {isRunning ? "Pause" : !timerRef.current ? "Start" : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Timer;
