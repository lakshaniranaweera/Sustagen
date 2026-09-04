"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import PortraitStage from "@/components/PortraitStage";
import { useAppState } from "@/lib/useAppState";
import { useEnabledGames, type GameEntry } from "@/lib/games";

export default function Home() {
  const { state, loading } = useAppState();
  const { games } = useEnabledGames();
  const landing = state?.landing ?? null;

  return (
    <PortraitStage background={landing?.backgroundImage}>
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />

      {/* Admin gear */}
      <Link
        href="/admin"
        aria-label="Admin settings"
        className="absolute right-8 top-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 003.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </Link>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-2xl font-semibold uppercase tracking-[0.4em] text-gold">
            Welcome to
          </p>
          <h1 className="gradient-text mt-4 animate-shimmer text-8xl font-black uppercase leading-none text-shadow">
            {landing?.title || "Campaign"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-3xl font-medium text-white/80">
            {landing?.subtitle || ""}
          </p>
        </motion.div>

        <div className="mt-24 flex w-full flex-col gap-10">
          {games.map((g, i) => (
            <GameCard key={g.id} game={g} index={i} />
          ))}
          {!loading && games.length === 0 && (
            <p className="text-2xl text-white/50">No games are available.</p>
          )}
        </div>

        {loading && (
          <p className="absolute bottom-10 text-white/40">Loading…</p>
        )}
      </div>
    </PortraitStage>
  );
}

function GameCard({ game, index }: { game: GameEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.15, duration: 0.6 }}
    >
      <Link href={game.path}>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={`group relative overflow-hidden rounded-[40px] bg-gradient-to-br ${game.gradient} p-1 shadow-card`}
        >
          <div className="flex items-center gap-10 rounded-[36px] bg-black/40 px-14 py-14 backdrop-blur-sm">
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-8xl">
              {game.emoji}
            </div>
            <div className="text-left">
              <span className="rounded-full bg-white/20 px-4 py-1 text-xl font-bold tracking-widest text-white">
                {game.tag}
              </span>
              <h2 className="mt-4 text-6xl font-black uppercase text-white text-shadow">
                {game.name}
              </h2>
              <p className="mt-3 text-2xl text-white/75">{game.description}</p>
            </div>
            <div className="ml-auto text-6xl text-white/60 transition group-hover:translate-x-2">
              →
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
