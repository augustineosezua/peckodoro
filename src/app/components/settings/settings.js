"use client";
import { authClient } from "@/app/lib/auth-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
const Settings = (props) => {
  const { settings, setShowSettings, setSettings, session, isAdmin } = props;
  // prettier-ignore
  const [focusBeforeLong, setFocusBeforeLong] = useState(settings.focusBeforeLong);
  const [focusTime, setFocusTime] = useState(settings.focusTime);
  const [shortBreak, setShortBreak] = useState(settings.shortBreak);
  const [longBreak, setLongBreak] = useState(settings.longBreak);
  const [autoStart, setAutoStart] = useState(settings.autoStart);
  const [userEmail, setUserEmail] = useState(session?.user?.email || "");

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
        toast.success("Account deleted successfully");
        setShowSettings(false);
      },
    });
  };

  const linkSpotify = async () => {
    authClient.linkSocial({
      provider: "spotify",
      callbackURL: "/",
      scopes: ["streaming", "user-read-email", "user-read-private"],
    });
  };

  return (
    <div className="flex flex-col items-center justify-center absolute top-0 w-screen h-screen bg-black/15 font-[family-name:var(--font-geist-sans)]">
      <div
        className="absolute w-screen h-screen top-0 z-2"
        onClick={() => {
          updateSetting();
          setShowSettings(false);
        }}
      ></div>
      <div className=" bg-[#FAF3E0] lg:h-[70%] lg:w-[35%] z-3 md:rounded-2xl flex flex-col h-screen w-screen">
        <div className="w-full flex justify-end items-center text-3xl p-6 border-b py-5 border-[#E0D7C3]">
          <span className="grow flex justify-center text-2xl">Settings</span>
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="cursor-pointer"
            onClick={() => {
              updateSetting();
              setShowSettings(false);
            }}
          >
            <g id="SVGRepo_iconCarrier">
              <path
                d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"
                fill="black"
              ></path>
            </g>
          </svg>
        </div>
        <div className="flex justify-center gap-6 pt-3 text-2xl font-[family-name:var(--font-chivo-mono)]">
          <span className="underline cursor-pointer text-[#54494B]">Timer</span>
          <span className="text-gray-500 decoration-gray-500 cursor-default">
            Account
          </span>
        </div>
        <div className="flex-col flex gap-4 pt-8 px-8">
          <div className="flex items-center gap-2">
            <span className="w-80">Study Time </span>
            <input
              className="rounded-lg outline-none p-2 text-center bg-[#E9CBA7] font-[family-name:var(--font-chivo-mono)]"
              type="number"
              max="999"
              min="0"
              value={focusTime}
              id="focus-time"
              onChange={handleChange}
            ></input>
            Minutes
          </div>
          <div className="flex items-center gap-2">
            <span className="w-80">Short Break </span>
            <input
              className="rounded-lg outline-none p-2 text-center bg-[#E9CBA7] font-[family-name:var(--font-chivo-mono)]"
              type="number"
              max="999"
              min="0"
              value={shortBreak}
              id="short-break"
              onChange={handleChange}
            ></input>
            Minutes
          </div>
          <div className="flex items-center gap-2">
            <span className="w-80">Short Break </span>
            <input
              className="rounded-lg outline-none p-2 text-center bg-[#E9CBA7] font-[family-name:var(--font-chivo-mono)]"
              type="number"
              max="999"
              min="0"
              value={longBreak}
              id="long-break"
              onChange={handleChange}
            ></input>
            Minutes
          </div>
          <div className="flex items-center gap-2">
            <span className="w-80">Sessions Before Long Break</span>
            <input
              className="rounded-lg outline-none p-2 text-center bg-[#E9CBA7] font-[family-name:var(--font-chivo-mono)]"
              type="number"
              max="999"
              min="0"
              value={focusBeforeLong}
              id="focus-before-long"
              onChange={handleChange}
            ></input>
            Rounds
          </div>
          <div className="flex items-center gap-2">
            <span className="w-80">Auto Start Timers</span>
            <div
              className={`w-24 h-10 rounded-full cursor-pointer px-2 flex items-center transition-colors duration-300 ${
                autoStart ? "bg-green-500" : "bg-red-500"
              }`}
              onClick={() => setAutoStart(!autoStart)}
            >
              <div
                className={`h-8 w-8 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  autoStart
                    ? "lg:translate-x-12 md:translate-x-11 translate-x-7"
                    : "translate-x-0"
                }`}
              ></div>
            </div>
          </div>
          {isAdmin ? (
            <button
              onClick={linkSpotify}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer w-36 justify-center"
              type="button"
            >
              <span className="flex items-center">
                {/* Spotify logo SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 236.05 225.25"
                  width={35}
                  height={35}
                >
                  <path
                    fill="#1ed760"
                    d="M122.37,3.31C61.99.91,11.1,47.91,8.71,108.29c-2.4,60.38,44.61,111.26,104.98,113.66,60.38,2.4,111.26-44.6,113.66-104.98C229.74,56.59,182.74,5.7,122.37,3.31Zm46.18,160.28c-1.36,2.4-4.01,3.6-6.59,3.24-.79-.11-1.58-.37-2.32-.79-14.46-8.23-30.22-13.59-46.84-15.93-16.62-2.34-33.25-1.53-49.42,2.4-3.51.85-7.04-1.3-7.89-4.81-.85-3.51,1.3-7.04,4.81-7.89,17.78-4.32,36.06-5.21,54.32-2.64,18.26,2.57,35.58,8.46,51.49,17.51,3.13,1.79,4.23,5.77,2.45,8.91Zm14.38-28.72c-2.23,4.12-7.39,5.66-11.51,3.43-16.92-9.15-35.24-15.16-54.45-17.86-19.21-2.7-38.47-1.97-57.26,2.16-1.02.22-2.03.26-3.01.12-3.41-.48-6.33-3.02-7.11-6.59-1.01-4.58,1.89-9.11,6.47-10.12,20.77-4.57,42.06-5.38,63.28-2.4,21.21,2.98,41.46,9.62,60.16,19.74,4.13,2.23,5.66,7.38,3.43,11.51Zm15.94-32.38c-2.1,4.04-6.47,6.13-10.73,5.53-1.15-.16-2.28-.52-3.37-1.08-19.7-10.25-40.92-17.02-63.07-20.13-22.15-3.11-44.42-2.45-66.18,1.97-5.66,1.15-11.17-2.51-12.32-8.16-1.15-5.66,2.51-11.17,8.16-12.32,24.1-4.89,48.74-5.62,73.25-2.18,24.51,3.44,47.99,10.94,69.81,22.29,5.12,2.66,7.11,8.97,4.45,14.09Z"
                  />
                </svg>
              </span>
              <span className="font-medium text-gray-800 text-base hidden lg:block">
                {" "}
                Spotify
              </span>
            </button>
          ) : null}
        </div>
        <div className="w-full flex justify-center items-center gap-4 py-10 text-white">
          <button
            className="p-4 cursor-pointer bg-[#54494B] rounded-2xl"
            onClick={() => {
              updateSetting();
              setShowSettings(false);
            }}
          >
            Save Settings
          </button>
          <button
            onClick={() => deleteUser()}
            className="p-4 cursor-pointer bg-[#C86B5A] text-black rounded-2xl"
          >
            Delete Account
          </button>
        </div>
        <div className="font-semibold w-full flex justify-center">
          {userEmail ? userEmail : " Not Logged In"}
        </div>
      </div>
    </div>
  );
};

export default Settings;
