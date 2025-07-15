"use client";
import Image from "next/image";
import Header from "./components/Header/header";
import Timer from "./components/timer/timer";
import { useState, useEffect, useRef } from "react";
import Settings from "./components/settings/settings";
import {
  useSession,
  signIn, // alias of authClient.signIn
  signOut,
  authClient, // available but not used here
} from "@/app/lib/auth-client";
import { Toaster, toast } from "sonner";
import SpotifyPlayer from "./components/SpotifyPlayer/SpotifyPlayer";

function shallowEqual(obj1, obj2) {
  const keysA = Object.keys(obj1);
  const keysB = Object.keys(obj2);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
}

export default function Home() {
  const { data: session } = useSession();
  //authClient.refreshToken()

  const ogSettings = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 10,
    focusBeforeLong: 3,
    autoStart: false,
  });
  const [spotifyExists, setSpotifyExists] = useState(null);

  useEffect(() => {
    toast.loading("Loading...", {
      id: "loading",
    });
    const checkSession = async () => {
      if (session) {
        toast.loading("Loading Settings...", {
          id: "loading",
        });
        console.log("Session:", session);
        const response = await fetch(`/api/settings/${session.user.id}`);
        if (response.ok) {
          const savedSettings = await response.json();
          if (!savedSettings) {
            toast.error("Error Fetching Your Settings", {
              id: "loading",
              position: "bottom-right",
            });
            return;
          }
          delete savedSettings.id;
          setSettings(savedSettings);
          ogSettings.current = savedSettings;
          toast.dismiss("loading");
          await spotifyHandler();
        } else {
          toast.error("Failed to load settings.", {
            id: "loading",
            position: "bottom-right",
          });
          return;
        }
      } else {
        toast.dismiss("signing-out");
        setSettings({
          focusTime: 25,
          shortBreak: 5,
          longBreak: 10,
          focusBeforeLong: 3,
          autoStart: false,
        });
        ogSettings.current = null;
        toast.success("Timer Loaded", {
          id: "loading",
          duration: 1000,
        });
        return;
      }
    };
    checkSession();
  }, [session]);

  useEffect(() => {
    const updateSettings = async () => {
      //prettier-ignore
      if (!ogSettings.current || shallowEqual(ogSettings.current, settings)) return;
      toast.loading("Saving new Settings...", {
        id: "loading-settings",
        position: "bottom-right",
      });
      if (session) {
        const res = await fetch(`/api/settings/${session.user.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        });
        const json = await res.json();
        if (json.message != "settings updated") {
          toast.error("Error updating your account settings", {
            id: "loading-settings",
            position: "bottom-right",
          });
        } else {
          ogSettings.current = settings;
          toast.success("Settings Updated", {
            id: "loading-settings",
            position: "bottom-right",
          });
        }
      }
    };
    updateSettings();
  }, [settings]);

  const spotifyHandler = async () => {
    const res = await fetch("/api/spotify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: session.user.id }),
    });

    if (!res.ok) {
      return;
    }

    const json = await res.json();
    setSpotifyExists(true);
  };

  return (
    <div className="main">
      <div className="flex w-screen font-[family-name:var(--font-geist-sans)]">
        <Header
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          session={session}
        />
      </div>
      <div className="w-full">
        <Timer settings={settings} />
      </div>
      {spotifyExists ? (
        <div className="w-full flex justify-center">
          <SpotifyPlayer session={session} />
        </div>
      ) : null}

      {showSettings ? (
        <Settings
          setShowSettings={setShowSettings}
          settings={settings}
          setSettings={setSettings}
          session={session}
        />
      ) : null}
    </div>
  );
}
