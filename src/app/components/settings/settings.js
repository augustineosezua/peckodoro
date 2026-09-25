"use client";
import { authClient } from "@/app/lib/auth-client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SPOTIFY_SCOPES } from "../SpotifyPlayer/useSpotify";
import { SpotifyMark } from "../SpotifyPlayer/MusicBrowser";
import { AppleMusicMark } from "../AppleMusic/AppleMusicBrowser";
import { disconnectAppleMusic } from "../AppleMusic/useAppleMusic";
import { readPauseOnBreaks, savePauseOnBreaks } from "../Music/preferences";

// A titled card of settings rows, like grouped lists in iOS/macOS settings
const Group = ({ title, children }) => (
  <section>
    <h3 className="px-1 pb-2 text-xs font-bold uppercase tracking-wider text-ink/60">
      {title}
    </h3>
    <div className="rounded-xl border-2 border-ink bg-white divide-y divide-ink/10">
      {children}
    </div>
  </section>
);

// Label (and optional hint) on the left, its control on the right
const Row = ({ label, hint, htmlFor, labelId, children }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3 min-h-14">
    <label htmlFor={htmlFor} id={labelId} className="min-w-0">
      <span className="block font-medium">{label}</span>
      {hint ? <span className="block text-sm text-ink/60">{hint}</span> : null}
    </label>
    <div className="shrink-0">{children}</div>
  </div>
);

const Switch = ({ checked, onChange, labelledBy }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelledBy}
    onClick={() => onChange(!checked)}
    className={`relative block w-12 h-7 rounded-full border-2 border-ink cursor-pointer transition-colors ${
      checked ? "bg-yolk" : "bg-straw"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-ink transition-transform duration-200 ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const Settings = (props) => {
  const {
    settings,
    setShowSettings,
    setSettings,
    session,
    isAdmin,
    spotifyExists,
    musicService,
    setMusicService,
  } = props;
  // prettier-ignore
  const [focusBeforeLong, setFocusBeforeLong] = useState(settings.focusBeforeLong);
  const [focusTime, setFocusTime] = useState(settings.focusTime);
  const [shortBreak, setShortBreak] = useState(settings.shortBreak);
  const [longBreak, setLongBreak] = useState(settings.longBreak);
  const [autoStart, setAutoStart] = useState(settings.autoStart);
  const [pauseOnBreaks, setPauseOnBreaks] = useState(readPauseOnBreaks);
  const [service, setService] = useState(musicService);
  const [userEmail, setUserEmail] = useState(session?.user?.email || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  // null while checking; true/false once we know if Apple Music is connected
  const [appleConnected, setAppleConnected] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!session) return;
    let stale = false;
    fetch("/api/apple-music/user-token", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { token: null }))
      .then((json) => !stale && setAppleConnected(Boolean(json.token)))
      .catch(() => !stale && setAppleConnected(false));
    return () => {
      stale = true;
    };
  }, [session]);

  const disconnectApple = async () => {
    setDisconnecting(true);
    const ok = await disconnectAppleMusic();
    setDisconnecting(false);
    if (ok) {
      setAppleConnected(false);
      toast.success("Apple Music disconnected");
    } else {
      toast.error("Couldn't disconnect Apple Music. Try again.");
    }
  };

  const close = () => {
    updateSetting();
    setShowSettings(false);
  };

  // A native modal dialog traps focus and makes the page behind it inert.
  // Focus goes back to whatever opened it (the Settings button) on close.
  const dialogRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.showModal();
    return () => opener?.focus?.();
  }, []);

  // Clicks on the backdrop land on the dialog itself, outside its box
  const onDialogClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const outside =
      e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (e.target === e.currentTarget && outside) close();
  };

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
    savePauseOnBreaks(pauseOnBreaks);
    if (service !== musicService) setMusicService(service);
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
      label: "Long break every",
      hint: "Focus sessions in a round",
      value: focusBeforeLong,
      unit: "sessions",
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      onCancel={(e) => {
        // Escape: close through our own path so changes are saved
        e.preventDefault();
        close();
      }}
      onClick={onDialogClick}
      className="settings-dialog pop-in sticker hidden open:flex flex-col p-0 m-0 bg-shell text-ink w-full max-w-none h-dvh max-h-none md:m-auto md:w-[30rem] md:h-fit md:max-h-[min(88vh,48rem)] md:rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b-2 border-ink bg-yolk shrink-0">
        <h2
          id="settings-title"
          className="font-[family-name:var(--font-display)] font-extrabold text-xl"
        >
          Settings
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close settings"
          className="p-2 -mr-2 rounded-lg hover:bg-ink/10 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 flex flex-col gap-6">
        <Group title="Timer">
          {numberFields.map((f) => (
            <Row key={f.id} label={f.label} hint={f.hint} htmlFor={f.id}>
              <span className="flex items-center w-32 rounded-lg border-2 border-ink/25 focus-within:border-ink bg-white transition-colors">
                <input
                  className="w-full min-w-0 bg-transparent py-1.5 pl-3 text-right outline-none font-[family-name:var(--font-display)] font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  type="number"
                  inputMode="numeric"
                  max="999"
                  min="0"
                  value={f.value}
                  id={f.id}
                  onChange={handleChange}
                />
                <span className="w-[4.5rem] shrink-0 pl-1.5 pr-3 text-sm text-ink/60">
                  {f.unit}
                </span>
              </span>
            </Row>
          ))}
          <Row
            label="Auto-start timers"
            hint="Begin the next session without pressing Start"
            labelId="auto-start-label"
          >
            <Switch checked={autoStart} onChange={setAutoStart} labelledBy="auto-start-label" />
          </Row>
        </Group>

        {session ? (
          <Group title="Music">
            {spotifyExists ? (
              <Row label="Play from" labelId="music-service-label">
                <div
                  role="radiogroup"
                  aria-labelledby="music-service-label"
                  className="flex rounded-full border-2 border-ink p-0.5 text-sm font-semibold"
                >
                  {[
                    ["apple", "Apple Music"],
                    ["spotify", "Spotify"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={service === id}
                      onClick={() => setService(id)}
                      className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        service === id
                          ? "bg-ink text-shell"
                          : "text-ink/70 hover:text-ink hover:bg-ink/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Row>
            ) : null}
            <Row
              label="Pause during breaks"
              hint="Music picks back up when focus time starts"
              labelId="pause-on-breaks-label"
            >
              <Switch
                checked={pauseOnBreaks}
                onChange={setPauseOnBreaks}
                labelledBy="pause-on-breaks-label"
              />
            </Row>
          </Group>
        ) : null}

        {session ? (
          <Group title="Connections">
            <Row
              label={
                <span className="flex items-center gap-2">
                  <AppleMusicMark size={18} /> Apple Music
                </span>
              }
              hint={
                appleConnected === null
                  ? "Checking…"
                  : appleConnected
                    ? "Connected to your account"
                    : "Connect by playing something in the music panel"
              }
            >
              {appleConnected ? (
                <button
                  type="button"
                  onClick={disconnectApple}
                  disabled={disconnecting}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-2 border-ink/25 hover:border-ink transition-colors disabled:opacity-50 disabled:cursor-default"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : null}
            </Row>
            {isAdmin ? (
              <Row
                label={
                  <span className="flex items-center gap-2">
                    <SpotifyMark size={18} /> Spotify
                  </span>
                }
                hint={spotifyExists ? "Connected" : "Needs Spotify Premium"}
              >
                <button
                  onClick={linkSpotify}
                  className="sticker-btn px-3 py-1.5 rounded-lg bg-shell cursor-pointer text-sm font-semibold"
                  type="button"
                >
                  {spotifyExists ? "Reconnect" : "Connect"}
                </button>
              </Row>
            ) : null}
          </Group>
        ) : null}

        <Group title="Account">
          {session ? (
            <>
              <Row label="Signed in as" hint={<span className="block truncate">{userEmail}</span>}>
                {null}
              </Row>
              <Row label="Delete account" hint="Removes your account and saved settings">
                <button
                  type="button"
                  onClick={() => (confirmDelete ? deleteUser() : setConfirmDelete(true))}
                  onBlur={() => setConfirmDelete(false)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-2 transition-colors ${
                    confirmDelete
                      ? "bg-[#b3261e] border-[#b3261e] text-white"
                      : "border-[#b3261e]/40 text-[#b3261e] hover:border-[#b3261e]"
                  }`}
                >
                  {confirmDelete ? "Click again" : "Delete"}
                </button>
              </Row>
            </>
          ) : (
            <Row label="Not signed in" hint="Log in to save settings and play music">
              <Link
                href="/login"
                className="sticker-btn inline-block px-3 py-1.5 rounded-lg bg-yolk text-sm font-semibold"
              >
                Log in
              </Link>
            </Row>
          )}
        </Group>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4 border-t-2 border-ink shrink-0">
        <p className="text-sm text-ink/60">Changes save when you close.</p>
        <button
          type="button"
          className="sticker-btn px-6 py-2 rounded-xl bg-beak font-bold cursor-pointer"
          onClick={close}
        >
          Done
        </button>
      </div>
    </dialog>
  );
};

export default Settings;
