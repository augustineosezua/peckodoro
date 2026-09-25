"use client";
import Image from "next/image";
import Link from "next/link";
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
import ChatBot from "./components/ChatBot/ChatBot";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setMode] = useState("Focus Time");

  // The page ground tints with the timer mode (see globals.css)
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  useEffect(() => {
    toast.loading("Loading...", {
      id: "loading",
    });
    const checkSession = async () => {
      if (session) {
        toast.loading("Loading Settings...", {
          id: "loading",
        });
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
        toast.dismiss("loading");
        setSettings({
          focusTime: 25,
          shortBreak: 5,
          longBreak: 10,
          focusBeforeLong: 3,
          autoStart: false,
        });
        // Unmounting the player disconnects it from Spotify
        setSpotifyExists(false);
        setIsAdmin(false);
        ogSettings.current = null;
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

  const checkAdmin = async () => {
    if (!session) return;
    const res = await fetch("/api/check-admin", { method: "POST" });
    const json = await res.json();
    return json.isAdmin;
  };

  const spotifyHandler = async () => {
    const admin = await checkAdmin();
    setIsAdmin(admin);
    if (session.user && admin) {
      const res = await fetch("/api/spotify", { method: "POST" });
      if (!res.ok) {
        return;
      }

      const json = await res.json();
      if (json.linked) {
        setSpotifyExists(true);
      }
    }
  };

  return (
    <div className="main relative flex flex-col h-screen overflow-hidden text-ink">
      <div className="flex w-full shrink-0">
        <Header
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          session={session}
        />
      </div>

      {/* The timer keeps the stage; the assistant docks to its right */}
      <div className="flex w-full flex-1 min-h-0">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          {/* Room below the timer for the task list and streaks */}
          <Timer settings={settings} onModeChange={setMode} />

          {session ? null : (
            <div className="w-full flex justify-center px-4 md:px-8 pt-6 shrink-0">
              <p className="text-sm text-ink/70 max-w-xs text-center">
                <Link
                  href="/login"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  Log in
                </Link>{" "}
                to save your timer settings and ask the study assistant
                questions.
              </p>
            </div>
          )}

          {/* Music dock sits in the page flow so nothing has to pad around it */}
          {spotifyExists ? (
            <SpotifyPlayer mode={mode} />
          ) : (
            <p className="w-full shrink-0 pb-4 pt-2 text-center text-xs text-ink/60">
              VIP members can control Spotify from here.
            </p>
          )}
        </main>

        {session ? <ChatBot session={session} /> : null}
      </div>

      {showSettings ? (
        <Settings
          setShowSettings={setShowSettings}
          settings={settings}
          setSettings={setSettings}
          session={session}
          isAdmin={isAdmin}
        />
      ) : null}
    </div>
  );
}
