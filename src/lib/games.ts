// ---------- Game registry ----------
// Single source of truth for which games exist. The landing page and the admin
// nav read from here, so adding a game = add a settings type + defaults (store.ts),
// a display page, an admin page, and one entry below.

export interface GameEntry {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  description: string;
  path: string; // public display route
  adminPath: string; // admin route
  gradient: string; // tailwind gradient classes for the landing card
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
  },
];
