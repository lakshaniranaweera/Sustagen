"use client";
import { motion } from "framer-motion";
import type { WheelSegment } from "@/lib/types";
import { defaultGiftImage } from "@/lib/assets";

const SIZE = 900;
const R = SIZE / 2;
const cx = R;
const cy = R;

// angle: clockwise degrees from 12 o'clock
function pt(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.sin(a), y: cy - radius * Math.cos(a) };
}

function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111111" : "#ffffff";
}

export interface WheelStyle {
  ringColorOuter?: string;
  ringColorInner?: string;
  pointerColor?: string;
  hubBorderColor?: string;
  centerText?: string;
  centerTextColor?: string;
}

export default function Wheel({
  segments,
  rotation,
  duration,
  centerImage,
  spinning,
  style,
}: {
  segments: WheelSegment[];
  rotation: number;
  duration: number;
  centerImage: string | null;
  spinning: boolean;
  style?: WheelStyle;
}) {
  const N = Math.max(segments.length, 1);
  const slice = 360 / N;
  const ringOuter = style?.ringColorOuter || "#7c3aed";
  const ringInner = style?.ringColorInner || "#0a0a12";
  const pointer = style?.pointerColor || "#f5c518";
  const hubBorder = style?.hubBorderColor || "#ffffff";
  const centerText = style?.centerText ?? "★";
  const centerTextColor = style?.centerTextColor || "#ffffff";

  return (
    <div className="relative" style={{ width: "100%", aspectRatio: "1 / 1" }}>
      {/* Pointer */}
      <div className="absolute left-1/2 top-[-14px] z-30 -translate-x-1/2">
        <svg width="70" height="80" viewBox="0 0 70 80">
          <defs>
            <linearGradient id="ptr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="1" stopColor={pointer} />
            </linearGradient>
          </defs>
          <path
            d="M35 70 L8 12 Q35 -2 62 12 Z"
            fill="url(#ptr)"
            stroke="#78350f"
            strokeWidth="3"
          />
          <circle cx="35" cy="18" r="6" fill="#78350f" />
        </svg>
      </div>

      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full p-[2.5%] shadow-glow"
        style={{
          background: `linear-gradient(to bottom, ${ringOuter}, ${ringInner})`,
        }}
      >
        <div
          className="relative h-full w-full rounded-full p-[1.5%]"
          style={{ background: ringInner }}
        >
          <motion.div
            className="h-full w-full"
            style={{ willChange: "transform" }}
            animate={{ rotate: rotation }}
            transition={{
              duration: spinning ? duration : 0,
              ease: spinning ? [0.12, 0.7, 0.1, 1] : "linear",
            }}
          >
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
              <defs>
                {segments.map((s, i) => {
                  const mid = (i + 0.5) * slice;
                  const c = pt(mid, R * 0.62);
                  return (
                    <clipPath id={`clip-${s.id}`} key={s.id}>
                      <circle cx={c.x} cy={c.y} r={R * 0.16} />
                    </clipPath>
                  );
                })}
              </defs>

              {segments.map((s, i) => {
                const a0 = i * slice;
                const a1 = (i + 1) * slice;
                const p0 = pt(a0, R);
                const p1 = pt(a1, R);
                const large = slice > 180 ? 1 : 0;
                const soldOut = !s.active || s.remainingWinners <= 0;
                const mid = (i + 0.5) * slice;
                const labelPos = pt(mid, R * 0.86);
                const imgPos = pt(mid, R * 0.62);
                const txtColor = contrastText(s.color);
                return (
                  <g key={s.id}>
                    <path
                      d={`M ${cx} ${cy} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`}
                      fill={s.color}
                      stroke="rgba(0,0,0,0.25)"
                      strokeWidth={2}
                      opacity={soldOut ? 0.4 : 1}
                    />
                    {/* segment image — uploaded image, else per-gift default */}
                    <image
                      href={s.image ?? defaultGiftImage(s.order)}
                      x={imgPos.x - R * 0.16}
                      y={imgPos.y - R * 0.16}
                      width={R * 0.32}
                      height={R * 0.32}
                      clipPath={`url(#clip-${s.id})`}
                      preserveAspectRatio="xMidYMid slice"
                      opacity={soldOut ? 0.5 : 1}
                    />
                    {/* label */}
                    <g
                      transform={`translate(${labelPos.x} ${labelPos.y}) rotate(${mid})`}
                    >
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={N > 10 ? 20 : 26}
                        fontWeight={800}
                        fill={txtColor}
                        style={{ textTransform: "uppercase" }}
                      >
                        {s.name.length > 14 ? s.name.slice(0, 13) + "…" : s.name}
                      </text>
                      {soldOut && (
                        <text
                          y={26}
                          textAnchor="middle"
                          fontSize={16}
                          fontWeight={900}
                          fill="#fff"
                        >
                          SOLD OUT
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={4}
              />
            </svg>
          </motion.div>

          {/* Center hub / logo or text */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-4 bg-white shadow-lg"
            style={{ borderColor: hubBorder }}
          >
            {centerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={centerImage}
                alt="logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand to-brand-dark px-2 text-center text-2xl font-black leading-tight"
                style={{ color: centerTextColor }}
              >
                {centerText || "★"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// helper exported for parent rotation math
export function computeRotation(
  currentRotation: number,
  winnerIndex: number,
  segmentCount: number,
  turns: number
): number {
  const slice = 360 / segmentCount;
  const center = (winnerIndex + 0.5) * slice;
  const jitter = (Math.random() - 0.5) * slice * 0.6;
  // rotation r must satisfy (center + r) ≡ 0 (mod 360) so the segment center
  // sits under the top pointer.
  const targetMod = ((360 - center - jitter) % 360 + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  return currentRotation + turns * 360 + delta;
}
