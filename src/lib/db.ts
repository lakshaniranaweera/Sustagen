import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

function defaultDb(): Database {
  const now = Date.now();
  return {
    landing: {
      backgroundImage: null,
      title: "SUMMER ACTIVATION",
      subtitle: "Pick your challenge and win big.",
    },
    gameA: {
      backgroundImage: null,
      wheelBackground: null,
      centerImage: null,
      spinDurationSec: 5,
      rotations: 6,
      buttonText: "SPIN",
      title: "SPIN THE WHEEL",
      subtitle: "Give it a spin and claim your prize!",
      popupTitle: "CONGRATULATIONS!",
      popupSubtitle: "You won",
      status: "running",
    },
    gameB: {
      backgroundImage: null,
      logo: null,
      title: "COGNITIVE TEST",
      subtitle: "THE AGILITY LIGHT REFLEX CHALLENGE",
      description:
        "A fast-paced game that measures hand-eye coordination and reaction speed.",
      durationSec: 30,
      sharpMindScore: 15,
      activeHoldMs: 0,
      targets: [
        { id: rid(), color: "#ef4444", image: null, label: "" },
        { id: rid(), color: "#3b82f6", image: null, label: "" },
        { id: rid(), color: "#22c55e", image: null, label: "" },
        { id: rid(), color: "#f59e0b", image: null, label: "" },
        { id: rid(), color: "#a855f7", image: null, label: "" },
        { id: rid(), color: "#ec4899", image: null, label: "" },
      ],
      successMessage: "SHARP MIND",
      failMessage: "KEEP PRACTICING",
      status: "running",
    },
    segments: [
      seg("Grand Prize", "#7c3aed", 5, 0),
      seg("Free Coffee", "#ef4444", 20, 1),
      seg("10% OFF", "#f59e0b", 30, 2),
      seg("Try Again", "#334155", 999, 3),
      seg("Gift Card", "#22c55e", 10, 4),
      seg("Mystery Box", "#0ea5e9", 8, 5),
    ],
    spins: [],
    sessions: [],
    adminPasswordHash: hashPassword("admin123"),
  };
  function rid() {
    return crypto.randomBytes(8).toString("hex");
  }
  function seg(name: string, color: string, total: number, order: number) {
    return {
      id: crypto.randomBytes(8).toString("hex") + now.toString(36),
      name,
      image: null,
      color,
      totalWinners: total,
      remainingWinners: total,
      active: true,
      order,
    };
  }
}

function ensure(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const uploads = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb(), null, 2), "utf8");
  }
}

export function readDb(): Database {
  ensure();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    const d = defaultDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2), "utf8");
    return d;
  }
}

export function writeDb(db: Database): void {
  ensure();
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}

// Mutate helper to reduce read/modify/write boilerplate
export function updateDb<T>(fn: (db: Database) => T): { db: Database; result: T } {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return { db, result };
}

export { hashPassword };
export function newId(): string {
  return crypto.randomBytes(10).toString("hex");
}
