"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FullscreenButton from "./FullscreenButton";

const W = 1080;
const H = 1920;

/**
 * Renders a fixed 1080x1920 portrait canvas and scales it (contain) to fit
 * any viewport — the primary target display and desktop/mobile alike.
 *
 * `back`: when set, shows a bottom-left arrow-only link to that route.
 * `fullscreen`: when true, shows a bottom-right fullscreen toggle.
 */
export default function PortraitStage({
  children,
  background,
  back,
  fullscreen,
}: {
  children: React.ReactNode;
  background?: string | null;
  back?: string;
  fullscreen?: boolean;
}) {
  const [scale, setScale] = useState(0.3);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fit() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / W, vh / H));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div
      className="stage relative"
      style={{
        background: background
          ? `#05050a`
          : "radial-gradient(circle at 50% 20%, #1a1030, #05050a 70%)",
      }}
    >
      {/* Wrapper takes the SCALED footprint so the page centers correctly;
          transform: scale() alone would keep the 1920px layout height. */}
      <div
        style={{ width: W * scale, height: H * scale }}
        className="relative shrink-0"
      >
        <div
          ref={ref}
          style={{
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundImage: background ? `url(${background})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          className="absolute left-0 top-0 overflow-hidden"
        >
          {children}

          {back && (
            <Link
              href={back}
              aria-label="Back"
              className="absolute bottom-8 left-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          )}

          {fullscreen && (
            <FullscreenButton className="absolute bottom-8 right-8 z-40" />
          )}
        </div>
      </div>
    </div>
  );
}
