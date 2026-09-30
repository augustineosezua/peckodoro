// All of the timer's time math lives here as plain functions of (round, settings, now),
// so the component only ever asks "how long is left?" and never counts ticks itself.
//
// A round is stored as:
//   mode       which of MODES is running
//   focusDone  focus sessions finished since the last long break
//   banked     ms run before the last pause
//   startedAt  when it was last started (ms since epoch), or null while paused
//   added      ms added on top of the mode's length with "+1 min"
// Time left is always (mode length + added) - (banked + time since startedAt), so the
// clock survives reloads, sleeping tabs and throttled intervals.

export const MODES = ["Focus Time", "Short Break", "Long Break"];

const MINUTE = 60 * 1000;
const DEFAULT_MINUTES = {
  "Focus Time": 25,
  "Short Break": 5,
  "Long Break": 15,
};
const SETTING_FOR = {
  "Focus Time": "focusTime",
  "Short Break": "shortBreak",
  "Long Break": "longBreak",
};

const isTime = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;

// A zero or garbled length would end the round the moment it starts, and with
// auto start on that loops forever, so anything unusable falls back to the default
export const modeLength = (mode, settings) => {
  const minutes = Number(settings?.[SETTING_FOR[mode]]);
  return (minutes > 0 ? minutes : DEFAULT_MINUTES[mode] ?? 25) * MINUTE;
};

export const focusPerCycle = (settings) => {
  const n = Math.floor(Number(settings?.focusBeforeLong));
  return n >= 1 ? n : 1;
};

export const newRound = (mode, focusDone, startedAt = null) => ({
  mode,
  focusDone,
  banked: 0,
  startedAt,
  added: 0,
});

export const isRunning = (round) => round.startedAt !== null;

// A clock set backwards can put startedAt in the future; that counts as no time, not negative time
export const elapsed = (round, now) =>
  round.banked + (isRunning(round) ? Math.max(0, now - round.startedAt) : 0);

export const roundLength = (round, settings) =>
  modeLength(round.mode, settings) + round.added;

export const timeLeft = (round, settings, now) =>
  Math.max(0, roundLength(round, settings) - elapsed(round, now));

// How long ago the round ran out, 0 if it hasn't
export const overdueBy = (round, settings, now) =>
  Math.max(0, elapsed(round, now) - roundLength(round, settings));

export const pause = (round, now) =>
  isRunning(round) ? { ...round, banked: elapsed(round, now), startedAt: null } : round;

export const resume = (round, now) =>
  isRunning(round) ? round : { ...round, startedAt: now };

export const addTime = (round, ms) => ({ ...round, added: round.added + ms });

// The round that follows this one, whether it ran out or was skipped
export const nextRound = (round, settings, now) => {
  let focusDone = round.focusDone;
  if (round.mode === "Focus Time") focusDone++;
  let mode = round.mode === "Focus Time" ? "Short Break" : "Focus Time";
  if (focusDone >= focusPerCycle(settings)) {
    mode = "Long Break";
    focusDone = 0;
  }
  return newRound(mode, focusDone, settings?.autoStart ? now : null);
};

// Rounds saved by an older version, or edited by hand, are checked field by field
export const readRound = (saved) => {
  if (!saved || !MODES.includes(saved.mode)) return null;
  const startedAt = isTime(saved.startedAt) ? saved.startedAt : null;
  return {
    mode: saved.mode,
    focusDone: isTime(saved.focusDone) ? Math.floor(saved.focusDone) : 0,
    banked: isTime(saved.banked) ? saved.banked : 0,
    startedAt,
    added: isTime(saved.added) ? saved.added : 0,
  };
};

// Rounded up, so a fresh 25 minute round reads 25:00 and 0:00 only shows as it ends
export const formatClock = (ms) => {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = (total % 60).toString().padStart(2, "0");
  return { minutes, seconds, text: `${minutes}:${seconds}` };
};
