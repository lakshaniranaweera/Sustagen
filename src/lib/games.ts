"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ---------- Game registry ----------
// Structural metadata for every game the build ships. Which of these are
// actually live is controlled per-deployment by `public/games.json` (see below),
// so a customer's kiosk can enable only the games they paid for — editable on
// the live server with no rebuild.
//
// Adding a game = add a settings type + defaults (store.ts), a display page, an
// admin page, one entry here, and one entry in public/games.json.

export interface GameEntry {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  description: string;
  path: string; // public display route
  adminPath: string; // admin route
  gradient: string; // tailwind gradient classes for the landing card
  enabled: boolean; // default when public/games.json is missing or omits this id
}

export const GAMES: GameEntry[] = [
  {
    id: "game-a",
    name: "Spin the Wheel",
    emoji: "🎡",
    tag: "GAME A",
    description: "Test your luck and win instant prizes",
    path: "/game-a",
    adminPath: "/admin/game-a",
    gradient: "from-violet-600 to-fuchsia-700",
    enabled: true,
  },
  {
    id: "game-b",
    name: "Cognitive Test",
    emoji: "⚡",
    tag: "GAME B",
    description: "The Agility Light Reflex Challenge",
    path: "/game-b",
    adminPath: "/admin/game-b",
    gradient: "from-cyan-500 to-blue-700",
    enabled: true,
  },
];

export function getGame(id: string): GameEntry | undefined {
  return GAMES.find((g) => g.id === id);
}

// ---------- Runtime enable/disable config (public/games.json) ----------

interface GameToggle {
  id: string;
  enabled: boolean;
}

// Fetched once and cached for the page's lifetime. `no-store` so edits on the
// live server take effect on the next reload. `null` = config unavailable →
// fall back to each game's built-in `enabled` default.
let configPromise: Promise<GameToggle[] | null> | null = null;

function loadGameConfig(): Promise<GameToggle[] | null> {
  if (configPromise) return configPromise;
  configPromise = fetch("/games.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((json: any) => {
      if (!json || !Array.isArray(json.games)) return null;
      return json.games
        .filter((g: any) => g && typeof g.id === "string")
        .map((g: any) => ({ id: g.id, enabled: g.enabled !== false }));
    })
    .catch(() => null);
  return configPromise;
}

// Resolve the ordered list of enabled games from a fetched config.
function resolveEnabled(config: GameToggle[] | null): GameEntry[] {
  if (!config) return GAMES.filter((g) => g.enabled);
  const byId = new Map(GAMES.map((g) => [g.id, g]));
  const seen = new Set<string>();
  const result: GameEntry[] = [];
  for (const t of config) {
    const g = byId.get(t.id);
    if (!g) continue;
    seen.add(t.id);
    if (t.enabled) result.push(g);
  }
  // Registry games not mentioned in the JSON keep their built-in default.
  for (const g of GAMES) if (!seen.has(g.id) && g.enabled) result.push(g);
  return result;
}

/** Live, ordered list of enabled games. `loading` is true until config loads. */
export function useEnabledGames(): { games: GameEntry[]; loading: boolean } {
  const [config, setConfig] = useState<GameToggle[] | null | undefined>(
    undefined
  );
  useEffect(() => {
    let mounted = true;
    loadGameConfig().then((c) => mounted && setConfig(c));
    return () => {
      mounted = false;
    };
  }, []);
  if (config === undefined)
    return { games: GAMES.filter((g) => g.enabled), loading: true };
  return { games: resolveEnabled(config), loading: false };
}

/** Whether one game is enabled. Returns null until the config has loaded. */
export function useGameEnabled(id: string): boolean | null {
  const [config, setConfig] = useState<GameToggle[] | null | undefined>(
    undefined
  );
  useEffect(() => {
    let mounted = true;
    loadGameConfig().then((c) => mounted && setConfig(c));
    return () => {
      mounted = false;
    };
  }, []);
  if (config === undefined) return null;
  const fallback = getGame(id)?.enabled ?? false;
  if (!config) return fallback;
  const t = config.find((c) => c.id === id);
  return t ? t.enabled : fallback;
}

/**
 * Guard a game/admin route: redirects to `fallback` when the game is disabled.
 * Returns `true` only once the game is confirmed enabled (so callers can hold a
 * loading state until then).
 */
export function useRequireGame(id: string, fallback: string): boolean {
  const router = useRouter();
  const enabled = useGameEnabled(id);
  useEffect(() => {
    if (enabled === false) router.replace(fallback);
  }, [enabled, fallback, router]);
  return enabled === true;
}
