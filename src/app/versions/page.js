"use client";
import React, { useState } from "react";
import Head from "next/head";
import "./versions.css";

const versionHistory = [
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
    <main className="max-w-2xl mx-auto p-6 font-[family-name:var(--font-geist-sans)]">
      <Head>
        <title>Peckodoro - Versions</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6 flex justify-between items-end">
        Version History{" "}
        <a href="../" className="text-base">
          Back to Peckodoro
        </a>
      </h1>
      <ul className="space-y-4">
        {versionHistory.map(({ version, date, description }) => (
          <li
            key={version}
            className="p-4 border border-[#FAF3E0] rounded-lg shadow-sm bg-white"
          >
            <div className="text-xl font-semibold">{version}</div>
            <div className="text-sm text-gray-500">{date}</div>
            <p className="mt-2 text-gray-700">{description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
