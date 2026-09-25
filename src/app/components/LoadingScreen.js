"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

// Covers the page while we find out who's signed in, so the signed-out layout
// never flashes for someone who's signed in. Fades out once `done` is true.
export default function LoadingScreen({ done }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 300);
    return () => clearTimeout(id);
  }, [done]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!done}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-ground transition-opacity duration-300 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <Image
        src="/peckodoro.png"
        width={96}
        height={96}
        alt=""
        priority
        className="loading-bob rounded-full border-2 border-ink shadow-[4px_4px_0_var(--ink)]"
      />
      <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl tracking-tight">
        Peckodoro
      </span>
      {/* The same eggs the timer fills, taking turns */}
      <span className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-egg w-3 h-4 rounded-[50%] bg-ink/25"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      <span className="sr-only">Loading Peckodoro</span>
    </div>
  );
}
