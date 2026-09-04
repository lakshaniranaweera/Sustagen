// ---------- Real-time sync across tabs (same browser, offline) ----------
// A write in one tab (e.g. admin) notifies every other tab (e.g. the kiosk
// display) so UI updates instantly with no reload. Uses BroadcastChannel with
// a localStorage `storage`-event fallback.

"use client";

const CHANNEL = "campaign-games";
const PING_KEY = "campaign-games:ping";

type Listener = () => void;
const listeners = new Set<Listener>();

let channel: BroadcastChannel | null = null;
let wired = false;

function ensureWired() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => listeners.forEach((l) => l());
  } catch {
    channel = null;
  }
  // Fallback / cross-window signal: storage events fire in *other* tabs.
  window.addEventListener("storage", (e) => {
    if (e.key === PING_KEY) listeners.forEach((l) => l());
  });
}

// Notify other tabs that the shared state changed.
export function broadcastChange() {
  ensureWired();
  try {
    channel?.postMessage({ type: "state-changed", ts: Date.now() });
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

// Subscribe to remote changes. Returns an unsubscribe function.
export function subscribe(fn: Listener): () => void {
  ensureWired();
  listeners.add(fn);
  return () => listeners.delete(fn);
}
