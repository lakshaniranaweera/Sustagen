"use client";
// Compatibility shim. The app no longer uses a server; state comes from the
// browser store. Prefer `useAppState()` in components. `getState()` remains for
// simple one-shot reads.
import { loadState } from "./store";
import type { AppState } from "./types";

export async function getState(): Promise<AppState> {
  return loadState();
}
