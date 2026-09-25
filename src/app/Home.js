"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "./components/Header/header";
import Timer from "./components/timer/timer";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Settings from "./components/settings/settings";
import {
  useSession,
  signIn, // alias of authClient.signIn
  signOut,
  authClient, // available but not used here
} from "@/app/lib/auth-client";
import { Toaster, toast } from "sonner";
import SpotifyPlayer from "./components/SpotifyPlayer/SpotifyPlayer";
import { SpotifyMark } from "./components/SpotifyPlayer/MusicBrowser";
import AppleMusicPlayer from "./components/AppleMusic/AppleMusicPlayer";
import { AppleMusicMark } from "./components/AppleMusic/AppleMusicBrowser";
import { signOutAppleMusic } from "./components/AppleMusic/useAppleMusic";
import { readMusicService, saveMusicService } from "./components/Music/preferences";
import ChatBot from "./components/ChatBot/ChatBot";
import SideRail from "./components/SideRail";
import Tutorial, { hasSeenTutorial } from "./components/Tutorial";
import LoadingScreen from "./components/LoadingScreen";

const DEFAULT_SETTINGS = {
  focusTime: 25,
  shortBreak: 5,
  longBreak: 10,
  focusBeforeLong: 3,
  autoStart: false,
};
// Last settings loaded from the account, so a reload shows the right clock straight away
const SETTINGS_KEY = "peckodoro-settings";

function shallowEqual(obj1, obj2) {
  const keysA = Object.keys(obj1);
  const keysB = Object.keys(obj2);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
}

// `initial` is what the server already knows about the visitor (see page.js):
// null when it couldn't tell, so the client works it out behind the loading screen.
export default function Home({ initial = null }) {
  const { data: liveSession, isPending } = useSession();
  // Until the client's own session check lands, trust the server's answer.
  // Same user → same object, so effects keyed on `session` don't re-run.
  const current = isPending && initial ? initial.session : liveSession;
  const currentUserId = current?.user?.id ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const session = useMemo(() => current, [currentUserId]);
  // The account the server already loaded settings for; skip refetching them once
  const preloadedFor = useRef(initial?.session?.user?.id ?? null);

  const ogSettings = useRef(initial?.settings ?? null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(initial?.settings ?? DEFAULT_SETTINGS);
  // False until the account's settings have loaded (or we know there's no account)
  const [settingsReady, setSettingsReady] = useState(Boolean(initial));
  // Covered by the loading screen until we know who's here (once per visit)
  const [booted, setBooted] = useState(Boolean(initial));
  const [showTutorial, setShowTutorial] = useState(false);
  const [spotifyExists, setSpotifyExists] = useState(initial?.spotifyLinked ?? null);
  const [isAdmin, setIsAdmin] = useState(initial?.isAdmin ?? false);
  // Everyone signed in gets Apple Music; VIPs with Spotify linked can pick it instead
  const [servicePref, setServicePref] = useState(null);
  const musicService = spotifyExists && servicePref !== "apple" ? "spotify" : "apple";
  const setMusicService = useCallback((service) => {
    setServicePref(service);
    saveMusicService(service);
  }, []);
  const [mode, setMode] = useState("Focus Time");
  // The side column shows one panel at a time: "chat", "music" or nothing.
  // Closing music hands the column back to whatever was there before.
  const [panel, setPanel] = useState(null);
  const beforeMusic = useRef(null);
  const [chatUnread, setChatUnread] = useState(false);

  // The assistant starts open where there's room for it beside the timer
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setPanel("chat");
  }, []);

  const setChatOpen = useCallback((open) => {
    setPanel(open ? "chat" : null);
    if (open) setChatUnread(false);
  }, []);

  const setMusicOpen = useCallback((value) => {
    setPanel((current) => {
      const isOpen = current === "music";
      const next = typeof value === "function" ? value(isOpen) : value;
      if (next && !isOpen) {
        beforeMusic.current = current;
        return "music";
      }
      if (!next && isOpen) return beforeMusic.current;
      return current;
    });
  }, []);
  const musicOpen = panel === "music";

  useEffect(() => {
    // Last-known settings, only needed when the server couldn't tell us
    if (!initial) {
      try {
        const cached = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (cached) setSettings(cached);
      } catch {}
    }
    setServicePref(readMusicService());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // First visit after signing in: walk through the page once it's fully laid out
  useEffect(() => {
    if (session && settingsReady && !hasSeenTutorial()) setShowTutorial(true);
    if (!session) setShowTutorial(false);
  }, [session, settingsReady]);

  useEffect(() => {
    if (!isPending && settingsReady) setBooted(true);
  }, [isPending, settingsReady]);

  // Never leave someone on the loading screen if a request hangs
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 10_000);
    return () => clearTimeout(id);
  }, []);

  // The page ground tints with the timer mode (see globals.css)
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  useEffect(() => {
    if (isPending) return;
    // The loading screen covers this, so no loading toasts
    const checkSession = async () => {
      if (session && preloadedFor.current === session.user.id) {
        // The server rendered this account's settings already
        preloadedFor.current = null;
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch {}
        return;
      }
      preloadedFor.current = null;
      if (session) {
        const response = await fetch(`/api/settings/${session.user.id}`);
        if (response.ok) {
          const savedSettings = await response.json();
          if (!savedSettings) {
            toast.error("Error Fetching Your Settings", {
              id: "loading",
              position: "bottom-right",
            });
            setSettingsReady(true);
            return;
          }
          delete savedSettings.id;
          setSettings(savedSettings);
          ogSettings.current = savedSettings;
          try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
          } catch {}
          try {
            await spotifyHandler();
          } finally {
            setSettingsReady(true);
          }
        } else {
          toast.error("Failed to load settings.", {
            id: "loading",
            position: "bottom-right",
          });
          setSettingsReady(true);
          return;
        }
      } else {
        toast.dismiss("signing-out");
        setSettings(DEFAULT_SETTINGS);
        try {
          localStorage.removeItem(SETTINGS_KEY);
        } catch {}
        setSettingsReady(true);
        // Unmounting the player disconnects it from Spotify; drop the Apple
        // Music sign-in from the page too (it stays saved to the account)
        setSpotifyExists(false);
        signOutAppleMusic();
        setMusicOpen(false);
        setIsAdmin(false);
        ogSettings.current = null;
        return;
      }
    };
    checkSession().catch(() => {
      toast.error("Couldn't load your settings. Check your connection.", {
        id: "loading",
        position: "bottom-right",
      });
      setSettingsReady(true);
    });
  }, [session, isPending]);

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
          try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          } catch {}
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
      <LoadingScreen done={booted} />
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
          <Timer
            settings={settings}
            ready={settingsReady}
            onModeChange={setMode}
          />

          {session ? null : (
            <div className="w-full flex justify-center px-4 md:px-8 pt-6 shrink-0">
              <p className="text-sm text-ink/70 max-w-xs text-center">
                <Link
                  href="/login"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  Log in
                </Link>{" "}
                to save your timer settings, play music and ask the study
                assistant questions.
              </p>
            </div>
          )}

          {/* Music dock sits in the page flow so nothing has to pad around it.
              It waits for settings so VIPs don't load Apple Music before Spotify. */}
          {session && settingsReady ? (
            musicService === "spotify" ? (
              <SpotifyPlayer
                mode={mode}
                browsing={musicOpen}
                setBrowsing={setMusicOpen}
              />
            ) : (
              <AppleMusicPlayer
                mode={mode}
                browsing={musicOpen}
                setBrowsing={setMusicOpen}
              />
            )
          ) : null}
        </main>

        {/* Hidden, not unmounted, so the conversation is still there after browsing music */}
        {session ? (
          <div className={musicOpen ? "hidden" : "contents"}>
            <ChatBot
              session={session}
              open={panel === "chat"}
              setOpen={setChatOpen}
              unread={chatUnread}
              setUnread={setChatUnread}
            />
          </div>
        ) : null}
        <div id="side-panel" className="contents" />

        {session ? (
          <SideRail
            panel={panel}
            onChat={() => setChatOpen(panel !== "chat")}
            onMusic={settingsReady ? () => setMusicOpen((o) => !o) : null}
            musicIcon={
              musicService === "spotify" ? (
                <SpotifyMark size={20} />
              ) : (
                <AppleMusicMark size={20} />
              )
            }
            chatUnread={chatUnread}
          />
        ) : null}
      </div>

      {showTutorial ? (
        <Tutorial onClose={() => setShowTutorial(false)} />
      ) : null}

      {showSettings ? (
        <Settings
          setShowSettings={setShowSettings}
          settings={settings}
          setSettings={setSettings}
          session={session}
          isAdmin={isAdmin}
          spotifyExists={Boolean(spotifyExists)}
          musicService={musicService}
          setMusicService={setMusicService}
        />
      ) : null}
    </div>
  );
}
