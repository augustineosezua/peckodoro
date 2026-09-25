"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const SEEN_KEY = "peckodoro-tutorial-seen";
const GUTTER = 16;
const GAP = 12;

// Steps point at elements marked with data-tour; a step whose element isn't on
// screen (like the side rail on small screens) is skipped
const STEPS = [
  {
    title: "Welcome to Peckodoro",
    body: "A quick look around so you know where everything is. It takes about 30 seconds.",
  },
  {
    target: "modes",
    title: "Focus, then rest",
    body: "Focus Time is for work, and the breaks are for resting. The timer moves between them by itself, and you can switch any time.",
  },
  {
    target: "start",
    title: "Start the clock",
    body: "Start and pause here. The timer keeps going if you reload or close the tab.",
  },
  {
    target: "rounds",
    title: "Fill the eggs",
    body: "Every focus session you finish fills an egg. Fill them all and you've earned a long break.",
  },
  {
    target: "settings",
    title: "Make it yours",
    body: "Change how long each round lasts, how many focus sessions come before a long break, and whether rounds start on their own.",
  },
  {
    target: "chat",
    title: "Ask the study assistant",
    body: "Stuck on something? Ask the assistant here. Your past conversations are saved.",
  },
  {
    target: "music",
    title: "Music for focusing",
    body: "Play music from Apple Music and control it from the bar at the bottom. Settings can pause it during breaks.",
  },
];

export function hasSeenTutorial() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Storage blocked: don't show the tour on every visit
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

function findTarget(name) {
  if (!name) return null;
  const el = document.querySelector(`[data-tour="${name}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return rect.width && rect.height ? el : null;
}

export default function Tutorial({ onClose }) {
  // Work out which steps apply once, when the tour opens
  const [steps] = useState(() =>
    STEPS.filter((s) => !s.target || findTarget(s.target))
  );
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardPos, setCardPos] = useState(null);
  const cardRef = useRef(null);
  const nextRef = useRef(null);

  const step = steps[index];
  const last = index === steps.length - 1;

  const finish = useCallback(() => {
    markSeen();
    onClose();
  }, [onClose]);

  const measure = useCallback(() => {
    const el = findTarget(step?.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => {
    findTarget(step?.target)?.scrollIntoView({ block: "nearest" });
    measure();
  }, [measure, step]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Place the card below the highlighted element, or above if there's no room
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const { width, height } = card.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

    if (!rect) {
      setCardPos({ left: (vw - width) / 2, top: (vh - height) / 2 });
      return;
    }
    let top = rect.bottom + GAP;
    if (top + height > vh - GUTTER) top = rect.top - GAP - height;
    setCardPos({
      left: clamp(rect.left + rect.width / 2 - width / 2, GUTTER, vw - width - GUTTER),
      top: clamp(top, GUTTER, vh - height - GUTTER),
    });
  }, [rect, index]);

  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect ? (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-200 ease-out"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 3px var(--beak), 0 0 0 9999px rgb(43 30 20 / 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink/55" />
      )}

      <div
        ref={cardRef}
        className="sticker absolute bg-shell text-ink rounded-2xl p-4 w-[min(20rem,calc(100vw-2rem))]"
        style={cardPos ?? { visibility: "hidden" }}
      >
        <p className="text-xs font-semibold text-ink/60 pb-1">
          {index + 1} of {steps.length}
        </p>
        <h2
          id="tour-title"
          className="font-[family-name:var(--font-display)] font-extrabold text-xl leading-tight pb-1"
        >
          {step.title}
        </h2>
        <p className="text-sm text-ink/80 pb-4">{step.body}</p>
        <div className="flex items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={finish}
              className="text-sm font-semibold text-ink/60 hover:text-ink underline-offset-2 hover:underline cursor-pointer"
            >
              Skip tour
            </button>
          )}
          <div className="flex gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="sticker-btn bg-shell px-3 py-1.5 rounded-xl font-semibold cursor-pointer"
              >
                Back
              </button>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? finish() : setIndex((i) => i + 1))}
              className="sticker-btn bg-yolk px-4 py-1.5 rounded-xl font-semibold cursor-pointer"
            >
              {last ? "Done" : index === 0 ? "Show me" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
