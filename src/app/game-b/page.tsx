"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PortraitStage from "@/components/PortraitStage";
import { Spinner } from "@/components/ui";
import { useAppState } from "@/lib/useAppState";
import { newId } from "@/lib/store";
import type { GameBSettings, CognitiveHit } from "@/lib/types";

type Phase = "start" | "playing" | "result";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("start");
  // Apply live admin changes only on the start screen.
  const { state, loading, mutate } = useAppState(phase === "start");
  const settings = state?.gameB ?? null;
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [result, setResult] = useState<{
    totalHits: number;
    best: number | null;
    avg: number | null;
    passed: boolean;
  } | null>(null);

  const hitsRef = useRef<CognitiveHit[]>([]);
  const activatedAt = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (holdRef.current) clearTimeout(holdRef.current);
    };
  }, []);

  const targets = settings?.targets || [];

  const activateRandom = useCallback(
    (prev: number) => {
      if (!settings || targets.length === 0) return;
      let next = Math.floor(Math.random() * targets.length);
      if (targets.length > 1) {
        while (next === prev) next = Math.floor(Math.random() * targets.length);
      }
      setActiveIdx(next);
      activatedAt.current = performance.now();
      if (holdRef.current) clearTimeout(holdRef.current);
      if (settings.activeHoldMs > 0) {
        holdRef.current = setTimeout(() => {
          activateRandom(next); // missed — move on without scoring
        }, settings.activeHoldMs);
      }
    },
    [targets, settings]
  );

  async function finish() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (holdRef.current) clearTimeout(holdRef.current);
    setActiveIdx(-1);
    const hits = hitsRef.current;
    const times = hits.map((h) => h.reactionMs);
    const best = times.length ? Math.min(...times) : null;
    const avg = times.length
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null;
    const passed = hits.length >= (settings?.sharpMindScore ?? 15);
    setResult({ totalHits: hits.length, best, avg, passed });
    setPhase("result");
    try {
      await mutate((draft) => {
        draft.sessions.push({
          id: newId(),
          createdAt: new Date().toISOString(),
          totalHits: hits.length,
          bestReactionMs: best,
          avgReactionMs: avg,
          passed,
          hits,
        });
      });
    } catch {
      /* non-blocking persistence */
    }
  }

  function start() {
    if (!settings) return;
    hitsRef.current = [];
    setScore(0);
    setResult(null);
    setTimeLeft(settings.durationSec);
    setPhase("playing");
    endAtRef.current = performance.now() + settings.durationSec * 1000;
    activateRandom(-1);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const remain = Math.max(0, endAtRef.current - performance.now());
      setTimeLeft(Math.ceil(remain / 1000));
      if (remain <= 0) finish();
    }, 100);
  }

  function tapTarget(i: number) {
    if (phase !== "playing" || i !== activeIdx) return;
    const rt = Math.round(performance.now() - activatedAt.current);
    hitsRef.current.push({
      index: hitsRef.current.length,
      reactionMs: rt,
      targetId: targets[i]?.id ?? "",
    });
    setScore((s) => s + 1);
    activateRandom(i);
  }

  if (loading || !settings)
    return (
      <PortraitStage>
        <div className="flex h-full items-center justify-center">
          <Spinner label="Loading challenge…" />
        </div>
      </PortraitStage>
    );

  return (
    <PortraitStage background={settings.backgroundImage}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85" />

      <Link
        href="/"
        className="absolute left-8 top-8 z-40 rounded-full bg-white/10 px-6 py-3 text-xl font-bold text-white backdrop-blur hover:bg-white/25"
      >
        ← Home
      </Link>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-16">
        <AnimatePresence mode="wait">
          {phase === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              {settings.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logo}
                  alt="logo"
                  className="mx-auto mb-10 h-40 w-40 rounded-3xl object-cover shadow-card"
                />
              )}
              <h1 className="gradient-text animate-shimmer text-8xl font-black uppercase text-shadow">
                {settings.title}
              </h1>
              <h2 className="mt-4 text-4xl font-bold uppercase tracking-widest text-cyan-300">
                {settings.subtitle}
              </h2>
              <p className="mx-auto mt-10 max-w-2xl text-3xl italic text-white/75">
                “{settings.description}”
              </p>
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.04 }}
                onClick={start}
                className="mt-16 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 px-24 py-8 text-5xl font-black uppercase tracking-wider text-white shadow-glow"
              >
                Start Game
              </motion.button>
              <p className="mt-10 text-2xl text-white/50">
                Reach {settings.sharpMindScore}+ hits in {settings.durationSec}s
                to prove a SHARP MIND
              </p>
            </motion.div>
          )}

          {phase === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-center"
            >
              <div className="mb-16 flex w-full max-w-3xl items-center justify-between">
                <Stat label="TIME" value={`${timeLeft}s`} accent="text-cyan-300" />
                <Stat label="SCORE" value={score} accent="text-gold" />
              </div>

              <ReactionPanel
                targets={targets}
                activeIdx={activeIdx}
                onTap={tapTarget}
              />
            </motion.div>
          )}

          {phase === "result" && result && (
            <ResultScreen
              settings={settings}
              result={result}
              onReplay={start}
            />
          )}
        </AnimatePresence>
      </div>
    </PortraitStage>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-black/50 px-10 py-6 text-center backdrop-blur">
      <div className="text-xl font-semibold uppercase tracking-widest text-white/50">
        {label}
      </div>
      <div className={`text-6xl font-black tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function ReactionPanel({
  targets,
  activeIdx,
  onTap,
}: {
  targets: GameBSettings["targets"];
  activeIdx: number;
  onTap: (i: number) => void;
}) {
  const cols = targets.length <= 4 ? 2 : 3;
  return (
    <div
      className="grid gap-10"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {targets.map((t, i) => {
        const active = i === activeIdx;
        return (
          <motion.button
            key={t.id}
            onPointerDown={() => onTap(i)}
            animate={{ scale: active ? 1.06 : 1 }}
            whileTap={{ scale: 0.9 }}
            className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full border-8 transition-colors"
            style={{
              background: active ? t.color : "rgba(255,255,255,0.06)",
              borderColor: active ? "#ffffff" : "rgba(255,255,255,0.12)",
              boxShadow: active ? `0 0 60px ${t.color}` : "none",
            }}
          >
            {t.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.image}
                alt={t.label}
                className="h-24 w-24 object-contain"
                style={{ opacity: active ? 1 : 0.3 }}
              />
            ) : (
              <span
                className="text-4xl font-black uppercase"
                style={{ color: active ? "#fff" : "rgba(255,255,255,0.25)" }}
              >
                {t.label || (active ? "TAP!" : "")}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function ResultScreen({
  settings,
  result,
  onReplay,
}: {
  settings: GameBSettings;
  result: {
    totalHits: number;
    best: number | null;
    avg: number | null;
    passed: boolean;
  };
  onReplay: () => void;
}) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-3xl text-center"
    >
      <motion.h1
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className={`text-8xl font-black uppercase text-shadow ${
          result.passed ? "gradient-text animate-shimmer" : "text-white/80"
        }`}
      >
        {result.passed ? settings.successMessage : settings.failMessage}
      </motion.h1>

      {result.passed && <Celebrate />}

      <div className="mt-14 grid grid-cols-3 gap-6">
        <ResultStat label="Total Hits" value={result.totalHits} />
        <ResultStat
          label="Best Reaction"
          value={result.best != null ? `${result.best}ms` : "—"}
        />
        <ResultStat
          label="Avg Reaction"
          value={result.avg != null ? `${result.avg}ms` : "—"}
        />
      </div>

      <p className="mt-10 text-3xl font-semibold text-white/70">
        Final Result:{" "}
        <span className={result.passed ? "text-emerald-400" : "text-amber-400"}>
          {result.passed ? "PASSED" : "TRY AGAIN"}
        </span>
      </p>

      <motion.button
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.04 }}
        onClick={onReplay}
        className="mt-14 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 px-20 py-7 text-4xl font-black uppercase text-white shadow-glow"
      >
        Play Again
      </motion.button>
    </motion.div>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-black/50 p-8 backdrop-blur">
      <div className="text-xl font-semibold uppercase tracking-widest text-white/50">
        {label}
      </div>
      <div className="mt-2 text-5xl font-black text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

function Celebrate() {
  const colors = ["#f5c518", "#22d3ee", "#a78bfa", "#22c55e", "#ec4899"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 80 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-3 w-3 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: "40%",
            background: colors[i % colors.length],
          }}
          initial={{ y: 0, opacity: 1 }}
          animate={{
            y: (Math.random() - 0.5) * 1600,
            x: (Math.random() - 0.5) * 1000,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.8 + Math.random(), ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
