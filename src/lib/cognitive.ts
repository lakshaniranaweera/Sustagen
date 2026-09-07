// Cognitive-test performance tiers, derived from the configured "Sharp Mind
// Score" (the hit count for the top tier). Shared by the game result screen
// and the admin session history.

export type CognitiveLevelKey =
  | "excellent"
  | "strong"
  | "average"
  | "needs-improvement";

export interface CognitiveLevel {
  key: CognitiveLevelKey;
  emoji: string;
  label: string;
  description: string;
  colorClass: string; // tailwind text colour for the tier
  badgeClass: string; // tailwind background for the admin badge pill
}

const LEVELS: Record<CognitiveLevelKey, CognitiveLevel> = {
  excellent: {
    key: "excellent",
    emoji: "🟢",
    label: "Excellent",
    description: "Outstanding cognitive performance",
    colorClass: "text-emerald-400",
    badgeClass: "bg-emerald-600",
  },
  strong: {
    key: "strong",
    emoji: "🔵",
    label: "Strong",
    description: "Above-average cognitive performance",
    colorClass: "text-sky-400",
    badgeClass: "bg-sky-600",
  },
  average: {
    key: "average",
    emoji: "🟡",
    label: "Average",
    description: "Normal cognitive performance",
    colorClass: "text-amber-400",
    badgeClass: "bg-amber-600",
  },
  "needs-improvement": {
    key: "needs-improvement",
    emoji: "🔴",
    label: "Needs Improvement",
    description: "Below-average cognitive performance",
    colorClass: "text-red-400",
    badgeClass: "bg-red-600",
  },
};

// Map a hit count to a tier. `sharpMindScore` is the Excellent threshold;
// Strong/Average scale down from it.
export function cognitiveLevel(
  hits: number,
  sharpMindScore: number
): CognitiveLevel {
  const s = Math.max(1, sharpMindScore);
  if (hits >= s) return LEVELS.excellent;
  if (hits >= Math.round(0.75 * s)) return LEVELS.strong;
  if (hits >= Math.round(0.5 * s)) return LEVELS.average;
  return LEVELS["needs-improvement"];
}

export function cognitiveLevelByKey(key: CognitiveLevelKey): CognitiveLevel {
  return LEVELS[key];
}
