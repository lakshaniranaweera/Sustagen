import type { WheelSegment, OddsMode } from "./types";

export interface SegmentProbability {
  id: string;
  name: string;
  probability: number;
  remaining: number;
}

/**
 * Segments eligible for winning.
 *  - "count" mode: active AND remainingWinners > 0 (they sell out).
 *  - "odds"  mode: active only (counts never exclude; odds drive the draw).
 */
export function eligibleSegments(
  segments: WheelSegment[],
  mode: OddsMode = "count"
): WheelSegment[] {
  if (mode === "odds") return segments.filter((s) => s.active && s.odds > 0);
  return segments.filter((s) => s.active && s.remainingWinners > 0);
}

function weightOf(s: WheelSegment, mode: OddsMode): number {
  return mode === "odds" ? s.odds : s.remainingWinners;
}

/**
 * Probability of each eligible segment, given the mode.
 * count: probability_i = remaining_i / sum(remaining)
 * odds:  probability_i = odds_i / sum(odds)
 */
export function computeProbabilities(
  segments: WheelSegment[],
  mode: OddsMode = "count"
): SegmentProbability[] {
  const eligible = eligibleSegments(segments, mode);
  const total = eligible.reduce((a, s) => a + weightOf(s, mode), 0);
  if (total <= 0) return [];
  return eligible.map((s) => ({
    id: s.id,
    name: s.name,
    remaining: s.remainingWinners,
    probability: weightOf(s, mode) / total,
  }));
}

/**
 * Pick a winning segment id using weighted random for the given mode.
 * Returns null when nothing is eligible.
 */
export function pickWinner(
  segments: WheelSegment[],
  mode: OddsMode = "count"
): string | null {
  const eligible = eligibleSegments(segments, mode);
  const total = eligible.reduce((a, s) => a + weightOf(s, mode), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const s of eligible) {
    r -= weightOf(s, mode);
    if (r < 0) return s.id;
  }
  return eligible[eligible.length - 1].id;
}

// Back-compat alias (count mode).
export function pickWeightedWinner(segments: WheelSegment[]): string | null {
  return pickWinner(segments, "count");
}
