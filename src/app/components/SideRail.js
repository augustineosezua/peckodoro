"use client";

const CHAT =
  "M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z";

// Wide screens only: a slim strip on the right edge that switches the side
// column between the study assistant and the music panel.
export default function SideRail({ panel, onChat, onMusic, musicIcon, chatUnread }) {
  const button = (active) =>
    `sticker-btn w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer relative ${
      active ? "bg-yolk" : "bg-shell"
    }`;

  return (
    <nav
      aria-label="Side panels"
      className="hidden lg:flex shrink-0 w-14 border-l-2 border-ink bg-surface flex-col items-center gap-3 pt-3"
    >
      <button
        type="button"
        onClick={onChat}
        aria-pressed={panel === "chat"}
        title={panel === "chat" ? "Hide the study assistant" : "Open the study assistant"}
        aria-label={panel === "chat" ? "Hide the study assistant" : "Open the study assistant"}
        className={button(panel === "chat")}
        data-tour="chat"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d={CHAT}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {chatUnread && panel !== "chat" ? (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-beak border-2 border-ink" />
        ) : null}
      </button>

      {onMusic ? (
        <button
          type="button"
          onClick={onMusic}
          aria-pressed={panel === "music"}
          title={panel === "music" ? "Close music" : "Browse music"}
          aria-label={panel === "music" ? "Close music" : "Browse music"}
          className={button(panel === "music")}
          data-tour="music"
        >
          {musicIcon}
        </button>
      ) : null}
    </nav>
  );
}
