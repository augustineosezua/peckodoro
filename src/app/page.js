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
  const [play, setPlay] = useState(false);
  const [player, setPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
        setPlay(false);
        setSpotifyExists(false);
        setIsAdmin(false);
        if (player) {
          player.disconnect();
        }
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
    console.log("Checking admin status for:", session.user.email);
    const res = await fetch("/api/check-admin", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: session.user.email }),
    });
    const json = await res.json();
    return json.isAdmin;
  };

  const spotifyHandler = async () => {
    const admin = await checkAdmin();
    setIsAdmin(admin);
    if (session.user && admin) {
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
      console.log("Spotify response:", json);
      if (json.accessToken) {
        setSpotifyExists(true);
        setPlay(true);
      }
    }
  };

  return (
    <div className="main flex flex-col h-screen overflow-hidden">
      <div className="flex w-screen font-[family-name:var(--font-geist-sans)] shrink-0">
        <Header
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          session={session}
        />
      </div>
      <div className="w-full shrink-0">
        <Timer settings={settings} />
      </div>

      {session ? (
        <ChatBot session={session} spotifyExists={spotifyExists} />
      ) : (
        <div className="w-full flex flex-1 justify-center items-center px-4 md:px-8 pt-10 pb-24 font-[family-name:var(--font-geist-sans)]">
          <div className="flex items-center gap-3 bg-[#f5edd8]/80 backdrop-blur-sm rounded-full border border-[#E0D7C3]/50 px-5 py-3 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="#54494B"/>
            </svg>
            <span className="text-sm text-[#54494B]/70">Sign in to access chat</span>
          </div>
        </div>
      )}

      {spotifyExists ? (
        <div
          className="w-full flex flex-col justify-center absolute bottom-0 items-center font-[family-name:var(--font-geist-sans)] "
          id="spotify-player-controls"
        >
          <SpotifyPlayer
            session={session}
            play={play}
            player={player}
            setPlayer={setPlayer}
          />
        </div>
      ) : (
        <div className="w-full flex justify-center absolute bottom-0 items-center font-[family-name:var(--font-geist-sans)] pb-4">
          <div className=" m-4 flex items-center gap-2 px-4 py-2 bg-[#f5edd8] rounded-full border border-[#E0D7C3] text-sm text-[#54494B]/70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#1DB954"/>
              <path d="M16.7 10.7C14.2 9.2 10.3 9 7.7 9.8C7.3 9.9 6.9 9.7 6.8 9.3C6.7 8.9 6.9 8.5 7.3 8.4C10.2 7.5 14.5 7.7 17.4 9.4C17.8 9.6 17.9 10.1 17.7 10.4C17.5 10.7 17.1 10.9 16.7 10.7ZM16.4 13.2C16.2 13.5 15.8 13.6 15.5 13.4C13.4 12.1 10.3 11.7 7.9 12.4C7.5 12.5 7.2 12.3 7.1 11.9C7 11.5 7.2 11.2 7.6 11.1C10.4 10.3 13.9 10.7 16.3 12.2C16.6 12.4 16.7 12.8 16.4 13.2ZM15.3 15.6C15.1 15.8 14.8 15.9 14.6 15.7C12.7 14.6 10.4 14.3 7.9 14.9C7.6 15 7.3 14.8 7.2 14.5C7.1 14.2 7.3 13.9 7.6 13.8C10.4 13.1 12.9 13.5 15.1 14.7C15.4 14.9 15.5 15.3 15.3 15.6Z" fill="white"/>
            </svg>
            <span>VIP members get Spotify integration</span>
          </div>
        </div>
      )}

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
