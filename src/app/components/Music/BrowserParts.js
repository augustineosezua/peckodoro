"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export const QUICK_SEARCHES = ["Lo-fi beats", "Classical focus", "Rain sounds", "Deep focus", "Jazz for study"];

export const msToClock = (ms = 0) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function Reconnect({ onReconnect, children, label = "Reconnect" }) {
  return (
    <div className="mx-2 mt-3 p-3 rounded-xl bg-straw text-sm flex items-center justify-between gap-3">
      <span>{children}</span>
      <button
        type="button"
        onClick={onReconnect}
        className="sticker-btn bg-yolk px-3 py-1.5 rounded-lg font-semibold cursor-pointer shrink-0"
      >
        {label}
      </button>
    </div>
  );
}

export function Row({ image, tile, title, subtitle, meta, active, onClick, onQueue, round = false }) {
  const Tag = onClick ? "button" : "div";
  return (
    <div
      className={`group flex items-center rounded-xl transition-colors ${
        active ? "bg-yolk" : onClick ? "hover:bg-ink/10" : ""
      }`}
    >
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={`min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5 text-left ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {tile ? (
        tile
      ) : image ? (
        // Covers come from Spotify/Apple already sized, so skip Next's optimizer
        <Image
          src={image}
          alt=""
          width={44}
          height={44}
          unoptimized
          className={`w-11 h-11 object-cover border-2 border-ink/15 shrink-0 ${
            round ? "rounded-full" : "rounded-lg"
          }`}
        />
      ) : (
        <span className="w-11 h-11 rounded-lg bg-straw shrink-0" />
      )}
      <span className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold truncate">{title}</span>
        {subtitle ? (
          <span className="text-sm text-ink/60 truncate">{subtitle}</span>
        ) : null}
      </span>
      {meta ? (
        <span className="text-sm text-ink/50 tabular-nums shrink-0">{meta}</span>
      ) : null}
    </Tag>
      {onQueue ? (
        <button
          type="button"
          onClick={onQueue}
          aria-label={`Add ${title} to queue`}
          title="Add to queue"
          className="mr-1 w-8 h-8 shrink-0 rounded-full flex items-center justify-center cursor-pointer hover:bg-ink/10 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

// Fetches the next page when scrolled into view; the button covers keyboards and fallbacks
export function LoadMore({ onLoad }) {
  const ref = useRef(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await onLoad();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [onLoad]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && load(), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  return (
    <div ref={ref} className="flex justify-center py-3">
      <button
        type="button"
        onClick={load}
        disabled={busy}
        className="px-4 py-1.5 rounded-full border-2 border-ink/20 hover:border-ink text-sm font-semibold cursor-pointer disabled:opacity-60"
      >
        {busy ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}

export const Section = ({ title, children }) => (
  <section className="pt-4">
    <h3 className="font-bold px-2 pb-1">{title}</h3>
    <div className="flex flex-col">{children}</div>
  </section>
);

export const Note = ({ children }) => (
  <p className="text-sm text-ink/60 px-2 py-6 text-center">{children}</p>
);


// The music panel's frame: header, tabs and a footer naming the service.
// Wide screens: takes the study assistant's column. Narrow: a sheet above the music bar.
export function BrowserShell({ onClose, notice, tabs, tab, onTab, footer, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[var(--dock-h)] z-[60] lg:static lg:z-auto lg:flex lg:w-[26rem] lg:shrink-0"
      role="region"
      aria-label="Music"
    >
      <div className="absolute inset-0 bg-ink/25 lg:hidden" onClick={onClose} />
      <div className="pop-in absolute right-0 top-0 bottom-0 w-full sm:w-[440px] lg:static lg:w-full lg:flex-1 bg-surface border-l-2 border-ink flex flex-col min-h-0">
        {/* Same header bar as the study assistant, so swapping panels feels like one place */}
        <div className="flex items-center gap-1 px-3 md:px-6 h-12 border-b-2 border-ink bg-yolk shrink-0">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-base flex-1 truncate">
            Music
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close music"
            title="Close music"
            className="p-1.5 rounded-lg hover:bg-ink/10 cursor-pointer transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {notice ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            {notice}
          </div>
        ) : (
          <>
            <div role="tablist" className="mx-4 mt-3 flex rounded-full border-2 border-ink p-1 text-sm font-semibold shrink-0">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => onTab(id)}
                  className={`flex-1 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                    tab === id ? "bg-ink text-shell" : "text-ink/70 hover:text-ink hover:bg-ink/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 pt-2">{children}</div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 px-4 min-h-[var(--dock-h)] border-t-2 border-ink shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
}
