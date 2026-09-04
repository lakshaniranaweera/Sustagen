// ---------- Shared domain types ----------

export type CampaignStatus = "running" | "paused";

// How the wheel picks a winner:
//  - "count": weighted by remaining winner counts; segments deplete and sell out.
//  - "odds":  weighted by fixed `odds` values; counts are logged but never exclude.
export type OddsMode = "count" | "odds";

export interface WheelSegment {
  id: string;
  name: string;
  image: string | null; // data URL or null
  color: string; // hex
  totalWinners: number;
  remainingWinners: number;
  odds: number; // relative weight (used when oddsMode === "odds")
  active: boolean;
  order: number;
}

export interface WheelSpin {
  id: string;
  createdAt: string; // ISO
  segmentId: string;
  segmentName: string;
  remainingAfter: number;
}

export interface GameASettings {
  backgroundImage: string | null;
  wheelBackground: string | null;
  centerImage: string | null;
  centerText: string;
  centerTextColor: string;
  spinDurationSec: number;
  rotations: number;
  buttonText: string;
  title: string;
  subtitle: string;
  popupTitle: string;
  popupSubtitle: string;
  status: CampaignStatus;
  // Winner selection
  oddsMode: OddsMode;
  // Wheel layout & colours
  wheelSize: number; // px width of the wheel on the display
  wheelOffsetX: number; // px horizontal nudge
  wheelOffsetY: number; // px vertical nudge
  ringColorOuter: string;
  ringColorInner: string;
  pointerColor: string;
  hubBorderColor: string;
  // Daily rollover
  dayStartHour: number; // 0-23, business-day boundary
  autoRollover: boolean; // reset remaining counts automatically at day boundary
  lastRolloverDay: string; // dayKey of the last rollover applied
}

export interface CognitiveTarget {
  id: string;
  color: string;
  image: string | null;
  label: string;
}

export interface GameBSettings {
  backgroundImage: string | null;
  logo: string | null;
  title: string;
  subtitle: string;
  description: string;
  durationSec: number;
  sharpMindScore: number;
  activeHoldMs: number; // how long a target stays lit before auto-moving (0 = until hit)
  targets: CognitiveTarget[];
  successMessage: string;
  failMessage: string;
  status: CampaignStatus;
  dayStartHour: number;
}

export interface CognitiveHit {
  index: number;
  reactionMs: number;
  targetId: string;
}

export interface CognitiveGameSession {
  id: string;
  createdAt: string;
  totalHits: number;
  bestReactionMs: number | null;
  avgReactionMs: number | null;
  passed: boolean;
  hits: CognitiveHit[];
}

export interface LandingSettings {
  backgroundImage: string | null;
  title: string;
  subtitle: string;
}

export interface AppState {
  version: number;
  gameA: GameASettings;
  gameB: GameBSettings;
  segments: WheelSegment[];
  spins: WheelSpin[];
  sessions: CognitiveGameSession[];
  landing: LandingSettings;
  adminPasswordHash: string;
}
