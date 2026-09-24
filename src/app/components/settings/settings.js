"use client";
import { authClient } from "@/app/lib/auth-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SPOTIFY_SCOPES } from "../SpotifyPlayer/useSpotify";
const Settings = (props) => {
  const { settings, setShowSettings, setSettings, session, isAdmin } = props;
  // prettier-ignore
  const [focusBeforeLong, setFocusBeforeLong] = useState(settings.focusBeforeLong);
  const [focusTime, setFocusTime] = useState(settings.focusTime);
  const [shortBreak, setShortBreak] = useState(settings.shortBreak);
  const [longBreak, setLongBreak] = useState(settings.longBreak);
  const [autoStart, setAutoStart] = useState(settings.autoStart);
  const [userEmail, setUserEmail] = useState(session?.user?.email || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => {
    updateSetting();
    setShowSettings(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleChange = (e) => {
    const input = e.target.value;
    const number = Number(input);
    const clamped = Math.max(0, Math.min(number, 999));
    switch (e.target.id) {
      case "focus-time":
        if (input === "") {
          setFocusTime("");
          break;
        }
        setFocusTime(clamped);
        break;

      case "short-break":
        if (input === "") {
          setShortBreak("");
          break;
        }
        setShortBreak(clamped);
        break;

      case "long-break":
        if (input === "") {
          setLongBreak("");
          break;
        }
        setLongBreak(clamped);
        break;

      case "focus-before-long":
        if (input === "") {
          setFocusBeforeLong("");
          break;
        }
        const clamped2 = Math.max(0, Math.max(1, number));
        setFocusBeforeLong(clamped2);
        break;

      default:
        break;
    }
  };

  const updateSetting = () => {
    setSettings({
      focusTime: focusTime || 25,
      shortBreak: shortBreak || 5,
      longBreak: longBreak || 15,
      focusBeforeLong: focusBeforeLong || 3,
      autoStart: autoStart || false,
      userId: settings.userId,
    });
  };

  const deleteUser = async () => {
    authClient.deleteUser({
      onError: (ctx) => {
        toast.error("Error deleting account");
      },
      onSuccess: (ctx) => {
        toast.success("Account deleted");
        setShowSettings(false);
      },
    });
  };

  const linkSpotify = async () => {
    authClient.linkSocial({
      provider: "spotify",
      callbackURL: "/",
      scopes: SPOTIFY_SCOPES,
    });
  };

  const numberFields = [
    { id: "focus-time", label: "Focus time", value: focusTime, unit: "min" },
    { id: "short-break", label: "Short break", value: shortBreak, unit: "min" },
    { id: "long-break", label: "Long break", value: longBreak, unit: "min" },
    {
      id: "focus-before-long",
      label: "Focus sessions before a long break",
      value: focusBeforeLong,
      unit: "",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="absolute inset-0" onClick={close}></div>
      <div className="sticker relative bg-shell w-full h-full md:h-auto md:max-w-md md:rounded-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink bg-yolk md:rounded-t-[14px]">
          <h2
            id="settings-title"
            className="font-[family-name:var(--font-display)] font-extrabold text-2xl"
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close settings"
            className="p-2 rounded-lg hover:bg-ink/10 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <section className="px-6 pt-5">
          <h3 className="font-bold text-lg pb-2">Timer</h3>
          <div className="flex flex-col divide-y divide-ink/10">
            {numberFields.map((f) => (
              <label
                key={f.id}
                htmlFor={f.id}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span>{f.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <input
                    className="w-16 rounded-lg border-2 border-ink/25 focus:border-ink outline-none py-1.5 text-center bg-white font-[family-name:var(--font-display)] font-bold tabular-nums"
                    type="number"
                    max="999"
                    min="0"
                    value={f.value}
                    id={f.id}
                    onChange={handleChange}
                  />
                  <span className="w-7 text-sm text-ink/60">{f.unit}</span>
                </span>
              </label>
            ))}
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span id="auto-start-label">Start the next timer automatically</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoStart}
                aria-labelledby="auto-start-label"
                onClick={() => setAutoStart(!autoStart)}
                className={`relative w-14 h-8 rounded-full border-2 border-ink cursor-pointer transition-colors shrink-0 mr-9 ${
                  autoStart ? "bg-yolk" : "bg-straw"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-ink transition-transform duration-200 ${
                    autoStart ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {isAdmin ? (
          <section className="px-6 pt-5">
            <h3 className="font-bold text-lg pb-2">Connections</h3>
            <button
              onClick={linkSpotify}
              className="sticker-btn flex items-center gap-2 px-4 py-2 rounded-xl bg-white cursor-pointer font-semibold"
              type="button"
            >
              <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 236.05 225.25"
                      width={22}
                      height={22}
                    >
                      <path
                        fill="#1ed760"
                        d="M122.37,3.31C61.99.91,11.1,47.91,8.71,108.29c-2.4,60.38,44.61,111.26,104.98,113.66,60.38,2.4,111.26-44.6,113.66-104.98C229.74,56.59,182.74,5.7,122.37,3.31Zm46.18,160.28c-1.36,2.4-4.01,3.6-6.59,3.24-.79-.11-1.58-.37-2.32-.79-14.46-8.23-30.22-13.59-46.84-15.93-16.62-2.34-33.25-1.53-49.42,2.4-3.51.85-7.04-1.3-7.89-4.81-.85-3.51,1.3-7.04,4.81-7.89,17.78-4.32,36.06-5.21,54.32-2.64,18.26,2.57,35.58,8.46,51.49,17.51,3.13,1.79,4.23,5.77,2.45,8.91Zm14.38-28.72c-2.23,4.12-7.39,5.66-11.51,3.43-16.92-9.15-35.24-15.16-54.45-17.86-19.21-2.7-38.47-1.97-57.26,2.16-1.02.22-2.03.26-3.01.12-3.41-.48-6.33-3.02-7.11-6.59-1.01-4.58,1.89-9.11,6.47-10.12,20.77-4.57,42.06-5.38,63.28-2.4,21.21,2.98,41.46,9.62,60.16,19.74,4.13,2.23,5.66,7.38,3.43,11.51Zm15.94-32.38c-2.1,4.04-6.47,6.13-10.73,5.53-1.15-.16-2.28-.52-3.37-1.08-19.7-10.25-40.92-17.02-63.07-20.13-22.15-3.11-44.42-2.45-66.18,1.97-5.66,1.15-11.17-2.51-12.32-8.16-1.15-5.66,2.51-11.17,8.16-12.32,24.1-4.89,48.74-5.62,73.25-2.18,24.51,3.44,47.99,10.94,69.81,22.29,5.12,2.66,7.11,8.97,4.45,14.09Z"
                      />
                    </svg>
              Connect Spotify
            </button>
          </section>
        ) : null}

        <div className="px-6 pt-8 pb-6 flex flex-col gap-6 mt-auto">
          <button
            className="sticker-btn w-full py-3 rounded-xl bg-beak font-bold text-lg cursor-pointer"
            onClick={close}
          >
            Save settings
          </button>

          <div className="border-t border-ink/15 pt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-ink/70 truncate">
              {userEmail ? `Signed in as ${userEmail}` : "Not logged in"}
            </span>
            {session ? (
              <button
                type="button"
                onClick={() => (confirmDelete ? deleteUser() : setConfirmDelete(true))}
                onBlur={() => setConfirmDelete(false)}
                className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold cursor-pointer border-2 transition-colors ${
                  confirmDelete
                    ? "bg-[#b3261e] border-[#b3261e] text-white"
                    : "border-transparent text-[#b3261e] hover:border-[#b3261e]"
                }`}
              >
                {confirmDelete ? "Click again to delete" : "Delete account"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
