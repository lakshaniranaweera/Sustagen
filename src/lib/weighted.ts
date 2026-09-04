import type { WheelSegment } from "./types";

export interface SegmentProbability {
  id: string;
  name: string;
  probability: number;
  remaining: number;
}

/**
 * Segments eligible for winning: active AND remainingWinners > 0.
 */
export function eligibleSegments(segments: WheelSegment[]): WheelSegment[] {
  return segments.filter((s) => s.active && s.remainingWinners > 0);
}

/**
 * Weighted probabilities based on remaining winner counts.
 * probability_i = remaining_i / sum(remaining)
 */
export function computeProbabilities(segments: WheelSegment[]): SegmentProbability[] {
  const eligible = eligibleSegments(segments);
  const total = eligible.reduce((a, s) => a + s.remainingWinners, 0);
  if (total <= 0) return [];
  return eligible.map((s) => ({
    id: s.id,
    name: s.name,
    remaining: s.remainingWinners,
    probability: s.remainingWinners / total,
  }));
}

/**
 * Pick a winning segment id using weighted random by remaining count.
 * Returns null when nothing is eligible (all sold out / inactive).
 */
export function pickWeightedWinner(segments: WheelSegment[]): string | null {
  const eligible = eligibleSegments(segments);
  const total = eligible.reduce((a, s) => a + s.remainingWinners, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const s of eligible) {
    r -= s.remainingWinners;
    if (r < 0) return s.id;
  }
  return eligible[eligible.length - 1].id;
}
