import type { DisplayState, PersistentOverride } from "./display";
import type { CampaignSnapshot, DonationFeedItem, HourlySummary, LeaderboardSnapshot } from "./live";

export type LayoutUpdatePayload = Pick<
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
> & {
  scene: "LAYOUT_UPDATE";
};

export type OverrideClearPayload = {
  scene: "OVERRIDE_CLEAR";
};

export type OverridePayload =
  | ({ scene: "TOTAL" } & Record<string, unknown>)
  | ({ scene: "ANNOUNCEMENT" } & Record<string, unknown>)
  | ({ scene: "MILESTONE" } & Record<string, unknown>);

export type DirectorScenePayload = LayoutUpdatePayload | OverrideClearPayload | OverridePayload;

export type DirectorReplayEvent = {
  seq: number;
  event: string;
  payload: DirectorScenePayload;
  timestamp: number;
};

export type LiveEventMap = {
  "live:donations": DonationFeedItem[];
  "live:teams": LeaderboardSnapshot;
  "live:participants": LeaderboardSnapshot;
  "live:hourly": HourlySummary;
  "live:campaign": CampaignSnapshot;
};

export type DirectorStateUpdate =
  | { type: "layout"; layout: Omit<DisplayState, "id" | "activeOverride" | "overridePayload" | "frozen"> }
  | { type: "override"; override: PersistentOverride }
  | { type: "override-clear" };
