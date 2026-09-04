// ---------- Shared domain types ----------

export type CampaignStatus = "running" | "paused";

export interface WheelSegment {
  id: string;
  name: string;
  image: string | null; // uploaded image url or null
  color: string; // hex
  totalWinners: number;
  remainingWinners: number;
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
  spinDurationSec: number;
  rotations: number;
  buttonText: string;
  title: string;
  subtitle: string;
  popupTitle: string;
  popupSubtitle: string;
  status: CampaignStatus;
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

export interface Database {
  gameA: GameASettings;
  gameB: GameBSettings;
  segments: WheelSegment[];
  spins: WheelSpin[];
  sessions: CognitiveGameSession[];
  landing: LandingSettings;
  adminPasswordHash: string;
}

export interface LandingSettings {
  backgroundImage: string | null;
  title: string;
  subtitle: string;
}
