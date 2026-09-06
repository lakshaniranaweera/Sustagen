"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "./types";
import { loadState, mutateState } from "./store";
import { subscribe } from "./realtime";

export interface UseAppState {
  state: AppState | null;
  loading: boolean;
  // Apply a mutation locally, persist it, and broadcast to other tabs.
  mutate: (fn: (draft: AppState) => void) => Promise<AppState>;
  // Re-read from storage (used when another tab changed it).
  reload: () => Promise<void>;
}

/**
 * Live view of the shared app state.
 * @param live when false, remote changes are NOT auto-applied (the caller pulls
 *   via `reload()` when safe — e.g. the wheel display while a spin is animating).
 */
export function useAppState(live = true): UseAppState {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const liveRef = useRef(live);
  liveRef.current = live;

  const reload = useCallback(async () => {
    const s = await loadState();
    setState(s);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadState()
      .then((s) => {
        if (mounted) setState(s);
      })
      .finally(() => mounted && setLoading(false));

    const unsub = subscribe(() => {
      if (!liveRef.current) return; // caller defers remote updates
      loadState().then((s) => mounted && setState(s));
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const mutate = useCallback(async (fn: (draft: AppState) => void) => {
    const next = await mutateState(fn);
    setState(next); // reflect our own write immediately (BroadcastChannel skips sender)
    return next;
  }, []);

  return { state, loading, mutate, reload };
}
