"use client";
import { useEffect, useRef, useState } from "react";

const W = 1080;
const H = 1920;

/**
 * Renders a fixed 1080x1920 portrait canvas and scales it (contain) to fit
 * any viewport — the primary target display and desktop/mobile alike.
 */
export default function PortraitStage({
  children,
  background,
}: {
  children: React.ReactNode;
  background?: string | null;
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
        </div>
      </div>
    </div>
  );
}
