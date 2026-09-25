"use client";
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";

const versionHistory = [
  {
    version: "v2-B",
    date: "2026-09-25",
    description:
      "Apple Music for everyone! Anyone signed in can now search Apple Music, play their library playlists and recently played songs, see what's up next, and control playback from the music bar. Your Apple Music sign-in is saved to your Peckodoro account, so it follows you and never passes to someone else using the same browser, and you can disconnect it any time in Settings. VIP members can pick Apple Music or Spotify in Settings. Settings has been redesigned with clearer sections, units inside each field, and \"Pause during breaks\" now lives there. The site loads faster and opens already signed in, with a new loading screen for the rare times it has to wait. Also fixed: the chat button covering the music controls on phones, and the Apple Music icon sometimes going blank. We also removed analytics tracking.",
  },
  {
    version: "v2.5",
    date: "2025-08-27",
    description:
      "Major Spotify integration update! Added full Spotify Web Playback SDK support with custom player controls, playlist browsing, search functionality, and queue management. Enhanced UI with Spotify-inspired dark theme, responsive design for mobile and desktop, touch gestures for mobile navigation, and beautifully styled volume controls. Improved user experience with hover effects, smooth transitions, and professional styling throughout the player interface.",
  },
  {
    version: "v0.1.2",
    date: "2025-07-05",
    description:
      "Added user accounts, sign in, sign out, and delete account functionality. Also added user settings to customize the Pomodoro timer. Reset passwords added aswell",
  },
  {
    version: "v0.1.1",
    date: "2025-07-05",
    description:
      "Added Pomodoro Timer Settings, allows users to customize timer lengths, and allows users to set auto start next timer  as well as sessions before a long break ",
  },
  {
    version: "v0.1.0",
    date: "2025-06-29",
    description:
      "Added Pomodoro Timer, includes a pause, start, long break, short breaks and a focus timer options.",
  },
];

export default function VersionHistoryPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 md:px-6 py-10 text-ink">
      <Head>
        <title>Peckodoro - Versions</title>
      </Head>
      <Link
        href="/"
        className="text-sm font-semibold underline underline-offset-2 text-ink/70 hover:text-ink"
      >
        Back to the timer
      </Link>
      <h1 className="font-[family-name:var(--font-display)] font-extrabold text-4xl tracking-tight pt-3 pb-8">
        What&apos;s new
      </h1>
      <ol className="relative border-l-2 border-ink ml-2 space-y-8">
        {versionHistory.map(({ version, date, description }, i) => (
          <li key={version} className="relative pl-6">
            <span
              className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-ink ${
                i === 0 ? "bg-yolk" : "bg-shell"
              }`}
            />
            <div className="flex items-baseline gap-3">
              <h2 className="font-[family-name:var(--font-display)] font-bold text-xl">
                {version}
              </h2>
              <time dateTime={date} className="text-sm text-ink/60">
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            <p className="mt-1.5 leading-relaxed text-ink/85 max-w-prose">
              {description}
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
