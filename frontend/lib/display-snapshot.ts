import type { LiveDataState } from "@/types/live";
import type { DisplayState, PersistentOverride, SanitizedDisplaySnapshot } from "@/types/display";

const SNAPSHOT_KEY = "display_snapshot_v1";
const LAST_SEQ_KEY = "display_last_seq";

type PersistableLayout = Pick<
  DisplayState,
  | "layoutTemplate"
  | "slots"
  | "progressBarType"
  | "progressBarGoal"
  | "progressBarStartTime"
  | "progressBarEndTime"
  | "autoCycleEnabled"
  | "autoCycleIntervalSec"
  | "showDonorNames"
  | "frozen"
>;

export function saveLastSeq(seq: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_SEQ_KEY, String(seq));
}

export function readLastSeq() {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(LAST_SEQ_KEY) ?? "0") || 0;
}

export function writeDisplaySnapshot(input: {
  layout: PersistableLayout;
  override: PersistentOverride;
  rotation: Record<number, number>;
  live: LiveDataState;
  lastSeq: number;
}) {
  if (typeof window === "undefined") return;

  const snapshot: SanitizedDisplaySnapshot = {
    timestamp: Date.now(),
    lastSeq: input.lastSeq,
    layout: input.layout,
    override: input.override,
    rotation: input.rotation,
    leaderboard: {
      teams: input.live.teams,
      participants: input.live.participants,
    },
    hourly: input.live.hourly,
  };

  sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  saveLastSeq(input.lastSeq);
}

export function readDisplaySnapshot(): SanitizedDisplaySnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SanitizedDisplaySnapshot;
  } catch {
    return null;
  }
}
