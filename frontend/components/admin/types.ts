export type SceneId =
    | "STANDBY"
    | "DONATIONS"
    | "TEAM_LEADERBOARD"
    | "PARTICIPANT_LEADERBOARD"
    | "ANNOUNCEMENT"
    | "MILESTONE";

export type LayoutTemplate =
    | "FULL_SCREEN"
    | "FULL_SCREEN_BAR"
    | "THREE_COLUMN"
    | "THREE_COLUMN_BAR"
    | "MAIN_SIDEBAR"
    | "MAIN_SIDEBAR_BAR";

export type SlotConfig =
    | { type: "pinned"; scene: SceneId }
    | { type: "rotating"; scenes: SceneId[] };

export type ProgressBarType = "PERIOD_TOTAL" | "DONATION_COUNT" | null;

export interface DisplayState {
    id: string;
    layoutTemplate: LayoutTemplate;
    slots: SlotConfig[];
    progressBarType: ProgressBarType;
    progressBarGoal: number | null;
    progressBarStartTime: string | null;
    progressBarEndTime: string | null;
    activeOverride: string | null;
    overridePayload: Record<string, unknown> | null;
    autoCycleEnabled: boolean;
    autoCycleIntervalSec: number;
    showDonorNames: boolean;
    frozen: boolean;
}

export interface TelemetrySnapshot {
    connectedCount: number;
    updatedAt?: string | null;
}

export interface TemplateOption {
    value: LayoutTemplate;
    label: string;
    preview: "single" | "triple" | "split";
    hasBar: boolean;
}
