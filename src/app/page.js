"use client";
import Image from "next/image";
import Header from "./components/Header/header";
import Timer from "./components/timer/timer";
import { useState, useEffect } from "react";
import Settings from "./components/settings/settings";

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  //const [timeLeft, setTimeLeft] = useState(25)
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    focusBeforeLong: 3,
    autoStart: false,
  });
  return (
    <div className="main">
      <div className="flex w-screen font-[family-name:var(--font-geist-sans)]">
        <Header showSettings={showSettings} setShowSettings={setShowSettings} />
      </div>
      <div className="w-full">
        <Timer settings={settings} />
      </div>
      {showSettings ? (
        <Settings
          setShowSettings={setShowSettings}
          settings={settings}
          setSettings={setSettings}
        />
      ) : null}
    </div>
  );
}
