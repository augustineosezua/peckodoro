"use client";
import React from "react";
import "./versions.css";

const versionHistory = [
  {
    version: "v0.1.0",
    date: "2025-06-29",
    description:
      "Added Pomodoro Timer, includes a pause, start, long break, short breaks and a focus timer options.",
  },
  {
    version: "v0.1.1",
    date: "2025-06-29",
    description:
      "Added Pomodoro Timer Settings, allows users to customize timer lengths, and allows users to set auto start next timer.",
  },
];

export default function VersionHistoryPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 font-[family-name:var(--font-geist-sans)]">
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
