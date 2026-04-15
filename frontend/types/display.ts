export type LayoutTemplate =
  | "FULL_SCREEN"
  | "FULL_SCREEN_BAR"
  | "THREE_COLUMN"
  | "THREE_COLUMN_BAR"
  | "MAIN_SIDEBAR"
  | "MAIN_SIDEBAR_BAR";

export type SceneId =
  | "STANDBY"
  | "DONATIONS"
  | "TEAM_LEADERBOARD"
  | "PARTICIPANT_LEADERBOARD"
  | "TOTAL"
  | "ANNOUNCEMENT"
  | "MILESTONE";

export type LayoutSceneId = Exclude<SceneId, "TOTAL" | "ANNOUNCEMENT" | "MILESTONE">;

export type ProgressBarType = "PERIOD_TOTAL" | "DONATION_COUNT";

export type SlotConfig =
  | { type: "pinned"; scene: LayoutSceneId }
  | { type: "rotating"; scenes: LayoutSceneId[] };

export type ProgressBarConfig = {
  type: ProgressBarType | null;
  goal: number | null;
  startTime: string | null;
  endTime: string | null;
};

export type DisplayState = {
  id?: string;
  layoutTemplate: LayoutTemplate;
  slots: SlotConfig[];
  progressBarType: ProgressBarType | null;
  progressBarGoal: number | null;
  progressBarStartTime: string | null;
  progressBarEndTime: string | null;
  activeOverride: SceneId | null;
  overridePayload?: Record<string, unknown> | null;
  autoCycleEnabled: boolean;
  autoCycleIntervalSec: number;
  showDonorNames: boolean;
  frozen: boolean;
};

export type PersistentOverride = {
  scene: Extract<SceneId, "TOTAL" | "ANNOUNCEMENT" | "MILESTONE">;
  payload?: Record<string, unknown>;
} | null;

export type DisplayStatusResponse = {
  connectedCount: number;
  lastEvent: {
    seq: number;
    event: string;
    payload: Record<string, unknown>;
    timestamp: number;
  } | null;
};

export type ConnectionState = "booting" | "live" | "reconnecting" | "offline";

export type SanitizedDisplaySnapshot = {
  timestamp: number;
  lastSeq: number;
  layout: Pick<
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
  override: PersistentOverride;
  rotation: Record<number, number>;
  leaderboard: {
    teams: import("./live").LeaderboardSnapshot | null;
    participants: import("./live").LeaderboardSnapshot | null;
  };
  hourly: import("./live").HourlySummary | null;
};
