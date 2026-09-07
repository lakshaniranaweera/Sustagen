"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PortraitStage from "@/components/PortraitStage";
import Wheel, { computeRotation } from "@/components/Wheel";
import { ToastProvider, Spinner } from "@/components/ui";
import { useAppState } from "@/lib/useAppState";
import { useRequireGame } from "@/lib/games";
import { newId } from "@/lib/store";
import { todayKey } from "@/lib/report";
import { DEFAULT_BG, defaultGiftImage } from "@/lib/assets";
import { eligibleSegments, pickWinner } from "@/lib/weighted";
import type { WheelSegment, WheelSpin } from "@/lib/types";

function GameA() {
  const gameReady = useRequireGame("game-a", "/");
  const [spinning, setSpinning] = useState(false);
  // Pause live remote updates while a spin animates so the wheel doesn't jump.
  const { state, loading, mutate, reload } = useAppState(!spinning);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelSegment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const spinningRef = useRef(false);

  const settings = state?.gameA ?? null;
  const segments = useMemo(
    () => (state ? [...state.segments].sort((a, b) => a.order - b.order) : []),
    [state]
  );
  const mode = settings?.oddsMode ?? "count";
  const eligibleCount = eligibleSegments(segments, mode).length;

  // Auto-dismiss the gift popup after 5s → back to the ready wheel.
  useEffect(() => {
    if (!winner) return;
    const t = window.setTimeout(() => setWinner(null), 5000);
    return () => window.clearTimeout(t);
  }, [winner]);

  // Auto-reset daily gift counts at the business-day boundary (once).
  const rolloverChecked = useRef(false);
  useEffect(() => {
    if (!settings || rolloverChecked.current) return;
    rolloverChecked.current = true;
    const today = todayKey(settings.dayStartHour);
    if (settings.autoRollover && settings.lastRolloverDay !== today) {
      mutate((d) => {
        d.segments.forEach((s) => {
          s.remainingWinners = s.totalWinners;
          s.active = true;
        });
        d.gameA.lastRolloverDay = today;
      });
    }
  }, [settings, mutate]);

  async function spin() {
    if (spinningRef.current || !settings || !state) return;
    if (settings.status !== "running") {
      setError("Campaign is currently paused.");
      return;
    }
    if (eligibleCount === 0) {
      setError("All prizes are sold out.");
      return;
    }
    const winnerId = pickWinner(segments, mode);
    if (!winnerId) {
      setError("No prizes remaining.");
      return;
    }

    spinningRef.current = true;
    setSpinning(true);
    setWinner(null);
    setError(null);

    const idx = segments.findIndex((s) => s.id === winnerId);
    const target = computeRotation(
      rotation,
      idx < 0 ? 0 : idx,
      segments.length,
      settings.rotations
    );
    setRotation(target);

    window.setTimeout(async () => {
      // Authoritatively record the result in the browser store.
      let recorded: WheelSpin | null = null;
      let winSeg: WheelSegment | null = null;
      const next = await mutate((draft) => {
        const seg = draft.segments.find((s) => s.id === winnerId);
        if (!seg) return;
        if (seg.remainingWinners > 0) seg.remainingWinners -= 1;
        if (draft.gameA.oddsMode === "count" && seg.remainingWinners === 0) {
          seg.active = false; // SOLD OUT
        }
        recorded = {
          id: newId(),
          createdAt: new Date().toISOString(),
          segmentId: seg.id,
          segmentName: seg.name,
          remainingAfter: seg.remainingWinners,
        };
        draft.spins.push(recorded);
      });
      winSeg = next.segments.find((s) => s.id === winnerId) ?? null;
      setWinner(winSeg);
      setSpinning(false);
      spinningRef.current = false;
      // Pull in any config changes an admin made during the spin.
      reload();
    }, settings.spinDurationSec * 1000 + 300);
  }

  if (loading || !settings || !gameReady)
    return (
      <PortraitStage>
        <div className="flex h-full items-center justify-center">
          <Spinner label="Loading game…" />
        </div>
      </PortraitStage>
    );

  return (
    <PortraitStage
      background={settings.backgroundImage ?? DEFAULT_BG.spinWheel}
      back="/"
      fullscreen
    >
      {settings.status === "paused" && (
        <div className="absolute right-8 top-8 z-40 rounded-full bg-red-600 px-6 py-3 text-xl font-bold text-white">
          PAUSED
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-between px-16 py-24">
        <div className="text-center">
          <h1 className="gradient-text animate-shimmer text-7xl font-black uppercase text-shadow">
            {settings.title}
          </h1>
          <p className="mt-4 text-3xl text-white/80">{settings.subtitle}</p>
        </div>

        <div
          style={{
            width: settings.wheelSize,
            maxWidth: "92vw",
            transform: `translate(${settings.wheelOffsetX}px, ${settings.wheelOffsetY}px)`,
          }}
        >
          <Wheel
            segments={segments}
            rotation={rotation}
            duration={settings.spinDurationSec || 5}
            centerImage={settings.centerImage || null}
            spinning={spinning}
            style={{
              ringColorOuter: settings.ringColorOuter,
              ringColorInner: settings.ringColorInner,
              pointerColor: settings.pointerColor,
              hubBorderColor: settings.hubBorderColor,
              centerText: settings.centerText,
              centerTextColor: settings.centerTextColor,
            }}
          />
        </div>

        <div
          className="flex w-full flex-col items-center gap-8"
          style={{
            transform: `translate(${settings.buttonOffsetX}px, ${settings.buttonOffsetY}px)`,
          }}
        >
          <motion.button
            onClick={spin}
            disabled={spinning || eligibleCount === 0 || settings.status !== "running"}
            whileTap={{ scale: 0.94 }}
            style={{
              background: settings.buttonColor,
              color: settings.buttonTextColor,
            }}
            className="relative h-32 w-96 rounded-full text-5xl font-black uppercase tracking-wider shadow-glow transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {spinning ? "SPINNING…" : settings.buttonText || "SPIN"}
          </motion.button>

          {error && (
            <div className="rounded-xl bg-red-600/90 px-6 py-3 text-xl font-semibold text-white">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Winner popup */}
      <AnimatePresence>
        {winner && (
          <motion.div
            key="winner-popup"
            className="absolute inset-0 z-50 flex items-center justify-center p-16"
            style={{
              backgroundImage: `url(${
                settings.giftBackground ?? DEFAULT_BG.spinWheelGift
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWinner(null)}
          >
            {winner.isPrize !== false && <Confetti />}
            <motion.div
              initial={{ scale: 0.5, y: 60, rotate: -6 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl p-16 text-center"
            >
              {winner.isPrize !== false ? (
                <>
                  <p className="text-4xl font-bold uppercase tracking-[0.3em] text-[#10214f] text-shadow">
                    {settings.popupTitle}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={winner.image ?? defaultGiftImage(winner.order)}
                    alt={winner.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="mx-auto mt-8 h-80 w-80 object-contain"
                  />
                  <p className="mt-8 text-4xl text-[#10214f] text-shadow">
                    {settings.popupSubtitle}
                  </p>
                  <h2 className="mt-2 text-8xl font-black uppercase text-[#10214f] text-shadow">
                    {winner.name}
                  </h2>
                </>
              ) : (
                <>
                  <h2 className="text-7xl font-black uppercase text-[#10214f] text-shadow">
                    {settings.losePopupTitle}
                  </h2>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={winner.image ?? defaultGiftImage(winner.order)}
                    alt={winner.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="mx-auto mt-8 h-80 w-80 object-contain"
                  />
                  <p className="mt-8 text-4xl text-[#10214f] text-shadow">
                    {settings.losePopupSubtitle}
                  </p>
                </>
              )}
              <button
                onClick={() => setWinner(null)}
                className="mt-10 rounded-full bg-gold px-12 py-5 text-3xl font-black uppercase text-amber-950 hover:bg-amber-400"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PortraitStage>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 });
  const colors = ["#f5c518", "#a78bfa", "#22c55e", "#ef4444", "#0ea5e9"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-4 w-4 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
          }}
          initial={{ y: -50, opacity: 1, rotate: 0 }}
          animate={{ y: 2000, rotate: 720, opacity: [1, 1, 0] }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <GameA />
    </ToastProvider>
  );
}
