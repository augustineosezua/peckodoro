"use client";
import { authClient } from "@/app/lib/auth-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
const Settings = (props) => {
  const { settings, setShowSettings, setSettings, session } = props;
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
