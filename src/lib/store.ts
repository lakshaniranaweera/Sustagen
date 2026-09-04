// ---------- Client-side store (IndexedDB, no server) ----------
// The entire app state lives in one IndexedDB record. Images are stored inline
// as data URLs, so IndexedDB (not localStorage) is used to avoid the ~5MB cap.
// Writes are broadcast to other tabs for real-time sync (see realtime.ts).

import type { AppState, WheelSegment } from "./types";
import { broadcastChange } from "./realtime";

const DB_NAME = "campaign-games";
const STORE = "app";
const KEY = "state";
export const STATE_VERSION = 2;

// ---- id / hashing helpers (browser) ----
export function newId(): string {
  const a = new Uint8Array(10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(a);
  } else {
    for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(pw: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(pw);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }
  // Extremely defensive fallback (SubtleCrypto requires a secure context).
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (h * 31 + pw.charCodeAt(i)) | 0;
  return "fallback" + (h >>> 0).toString(16);
}

// ---- defaults ----
function seg(
  name: string,
  color: string,
  total: number,
  odds: number,
  order: number
): WheelSegment {
  return {
    id: newId(),
    name,
    image: null,
    color,
    totalWinners: total,
    remainingWinners: total,
    odds,
    active: true,
    order,
  };
}

// Default admin password is "admin123" (sha-256). Precomputed to keep
// defaultState() synchronous; it is verified against a runtime hash on login.
const DEFAULT_PW_HASH =
  "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

export function defaultState(): AppState {
  return {
    version: STATE_VERSION,
    landing: {
      backgroundImage: null,
      title: "SUMMER ACTIVATION",
      subtitle: "Pick your challenge and win big.",
    },
    gameA: {
      backgroundImage: null,
      wheelBackground: null,
      centerImage: null,
      centerText: "★",
      centerTextColor: "#ffffff",
      spinDurationSec: 5,
      rotations: 6,
      buttonText: "SPIN",
      title: "SPIN THE WHEEL",
      subtitle: "Give it a spin and claim your prize!",
      popupTitle: "CONGRATULATIONS!",
      popupSubtitle: "You won",
      status: "running",
      oddsMode: "count",
      wheelSize: 860,
      wheelOffsetX: 0,
      wheelOffsetY: 0,
      ringColorOuter: "#7c3aed",
      ringColorInner: "#0a0a12",
      pointerColor: "#f5c518",
      hubBorderColor: "#ffffff",
      dayStartHour: 0,
      autoRollover: false,
      lastRolloverDay: "",
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
        { id: newId(), color: "#ef4444", image: null, label: "" },
        { id: newId(), color: "#3b82f6", image: null, label: "" },
        { id: newId(), color: "#22c55e", image: null, label: "" },
        { id: newId(), color: "#f59e0b", image: null, label: "" },
        { id: newId(), color: "#a855f7", image: null, label: "" },
        { id: newId(), color: "#ec4899", image: null, label: "" },
      ],
      successMessage: "SHARP MIND",
      failMessage: "KEEP PRACTICING",
      status: "running",
      dayStartHour: 0,
    },
    segments: [
      seg("Grand Prize", "#7c3aed", 5, 5, 0),
      seg("Free Coffee", "#ef4444", 20, 20, 1),
      seg("10% OFF", "#f59e0b", 30, 30, 2),
      seg("Try Again", "#334155", 999, 40, 3),
      seg("Gift Card", "#22c55e", 10, 10, 4),
      seg("Mystery Box", "#0ea5e9", 8, 8, 5),
    ],
    spins: [],
    sessions: [],
    adminPasswordHash: DEFAULT_PW_HASH,
  };
}

// ---- IndexedDB access ----
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbSet<T>(key: string, value: T): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

// Deep-merge stored state onto defaults so new fields appear after upgrades
// without wiping existing customization.
function migrate(stored: any): AppState {
  const d = defaultState();
  if (!stored || typeof stored !== "object") return d;
  const gameA = { ...d.gameA, ...(stored.gameA || {}) };
  const gameB = { ...d.gameB, ...(stored.gameB || {}) };
  const segments: WheelSegment[] = Array.isArray(stored.segments)
    ? stored.segments.map((s: any, i: number) => ({
        ...d.segments[0],
        ...s,
        odds: typeof s.odds === "number" ? s.odds : s.totalWinners ?? 1,
        order: typeof s.order === "number" ? s.order : i,
      }))
    : d.segments;
  return {
    ...d,
    ...stored,
    version: STATE_VERSION,
    gameA,
    gameB,
    segments,
    spins: Array.isArray(stored.spins) ? stored.spins : [],
    sessions: Array.isArray(stored.sessions) ? stored.sessions : [],
    landing: { ...d.landing, ...(stored.landing || {}) },
    adminPasswordHash: stored.adminPasswordHash || d.adminPasswordHash,
  };
}

let cache: AppState | null = null;

export async function loadState(): Promise<AppState> {
  if (typeof window === "undefined") return defaultState();
  try {
    const stored = await idbGet<any>(KEY);
    const state = migrate(stored);
    if (!stored) await idbSet(KEY, state); // seed defaults on first run
    cache = state;
    return state;
  } catch {
    const d = defaultState();
    cache = d;
    return d;
  }
}

export async function saveState(state: AppState): Promise<void> {
  if (typeof window === "undefined") return;
  cache = state;
  await idbSet(KEY, state);
  broadcastChange();
}

// Load → mutate → save → broadcast. The mutator receives a fresh copy.
export async function mutateState(
  fn: (draft: AppState) => void
): Promise<AppState> {
  const current = await loadState();
  const draft: AppState = structuredClone(current);
  fn(draft);
  await saveState(draft);
  return draft;
}

export function getCached(): AppState | null {
  return cache;
}

// Compare a plaintext password against the stored hash.
export async function verifyPassword(
  state: AppState,
  input: string
): Promise<boolean> {
  return (await hashPassword(input)) === state.adminPasswordHash;
}
