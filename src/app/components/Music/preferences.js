// Music preferences kept in the browser, set from Settings and read by the players
const BREAKS_KEY = "peckodoro-pause-on-breaks";
const SERVICE_KEY = "peckodoro-music-service";

export function readPauseOnBreaks() {
  try {
    return localStorage.getItem(BREAKS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function savePauseOnBreaks(on) {
  try {
    localStorage.setItem(BREAKS_KEY, on ? "on" : "off");
  } catch {}
}

// "spotify" or "apple"; null until the user picks one
export function readMusicService() {
  try {
    return localStorage.getItem(SERVICE_KEY);
  } catch {
    return null;
  }
}

export function saveMusicService(service) {
  try {
    localStorage.setItem(SERVICE_KEY, service);
  } catch {}
}
