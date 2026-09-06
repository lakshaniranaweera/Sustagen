"use client";
import { useEffect, useState } from "react";

// Toggles the browser Fullscreen API. Renders nothing if unsupported.
export default function FullscreenButton({
  className = "",
}: {
  className?: string;
}) {
  const [isFull, setIsFull] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(
      typeof document !== "undefined" &&
        !!document.documentElement.requestFullscreen
    );
    const onChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!supported) return null;

  async function toggle() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* user gesture / permission issues — ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFull ? "Exit fullscreen" : "Enter fullscreen"}
      className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 ${className}`}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {isFull ? (
          // compress (exit)
          <>
            <path d="M9 3v3a3 3 0 0 1-3 3H3" />
            <path d="M15 3v3a3 3 0 0 0 3 3h3" />
            <path d="M9 21v-3a3 3 0 0 0-3-3H3" />
            <path d="M15 21v-3a3 3 0 0 1 3-3h3" />
          </>
        ) : (
          // expand (enter)
          <>
            <path d="M3 9V5a2 2 0 0 1 2-2h4" />
            <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
            <path d="M3 15v4a2 2 0 0 0 2 2h4" />
            <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
          </>
        )}
      </svg>
    </button>
  );
}
