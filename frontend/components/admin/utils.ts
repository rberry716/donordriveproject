import type { LayoutTemplate, SceneId, SlotConfig, TemplateOption } from "./types";

export const SCENE_OPTIONS: readonly SceneId[] = [
    "STANDBY",
    "DONATIONS",
    "TEAM_LEADERBOARD",
    "PARTICIPANT_LEADERBOARD",
    "ANNOUNCEMENT",
    "MILESTONE",
] as const;

export const TEMPLATE_OPTIONS: readonly TemplateOption[] = [
    { value: "FULL_SCREEN", label: "Full Screen", preview: "single", hasBar: false },
    { value: "FULL_SCREEN_BAR", label: "Full Screen + Bar", preview: "single", hasBar: true },
    { value: "THREE_COLUMN", label: "Three Column", preview: "triple", hasBar: false },
    { value: "THREE_COLUMN_BAR", label: "Three Column + Bar", preview: "triple", hasBar: true },
    { value: "MAIN_SIDEBAR", label: "Main + Sidebar", preview: "split", hasBar: false },
    { value: "MAIN_SIDEBAR_BAR", label: "Main + Sidebar + Bar", preview: "split", hasBar: true },
] as const;

const SLOT_COUNT_BY_TEMPLATE: Record<LayoutTemplate, number> = {
    FULL_SCREEN: 1,
    FULL_SCREEN_BAR: 1,
    THREE_COLUMN: 3,
    THREE_COLUMN_BAR: 3,
    MAIN_SIDEBAR: 2,
    MAIN_SIDEBAR_BAR: 2,
};

export function sceneLabel(scene: SceneId): string {
    switch (scene) {
        case "STANDBY":
            return "Standby";
        case "DONATIONS":
            return "Donations";
        case "TEAM_LEADERBOARD":
            return "Team Leaderboard";
        case "PARTICIPANT_LEADERBOARD":
            return "Participant Leaderboard";
        case "ANNOUNCEMENT":
            return "Announcement";
        case "MILESTONE":
            return "Milestone";
    }
}

export function templateLabel(template: LayoutTemplate): string {
    return TEMPLATE_OPTIONS.find((option) => option.value === template)?.label || template;
}

export function templateHasBar(template: LayoutTemplate): boolean {
    return template.endsWith("_BAR");
}

export function templatePreviewSegments(template: LayoutTemplate): number[] {
    const baseTemplate = template.replace("_BAR", "") as LayoutTemplate;

    if (baseTemplate === "FULL_SCREEN") {
        return [100];
    }

    if (baseTemplate === "MAIN_SIDEBAR") {
        return [68, 32];
    }

    return [33, 34, 33];
}

export function buildSlotsForTemplate(template: LayoutTemplate, existing: SlotConfig[]): SlotConfig[] {
    const slotCount = SLOT_COUNT_BY_TEMPLATE[template];
    const next = existing.slice(0, slotCount).map((slot) => {
        if (slot.type === "pinned") {
            return { type: "pinned" as const, scene: slot.scene };
        }

        return { type: "rotating" as const, scenes: [...slot.scenes] };
    });

    while (next.length < slotCount) {
        next.push({ type: "pinned", scene: "STANDBY" });
    }

    return next;
}

export function formatCurrency(value: number | null | undefined): string {
    const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return "Awaiting sync";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export function toDatetimeLocalValue(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
}

export function fromDatetimeLocalValue(value: string): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

export type QuarterHourOption = {
    value: string;
    label: string;
    iso: string;
};

function padTimeUnit(value: number): string {
    return String(value).padStart(2, "0");
}

function createTodayTime(reference: Date, hours: number, minutes: number): Date {
    return new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), hours, minutes, 0, 0);
}

function formatTimeOptionLabel(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export function buildQuarterHourOptions(reference = new Date()): QuarterHourOption[] {
    const flooredQuarter = new Date(reference);
    flooredQuarter.setSeconds(0, 0);
    flooredQuarter.setMinutes(Math.floor(flooredQuarter.getMinutes() / 15) * 15);

    return [-3, -2, -1, 0, 1, 2, 3, 4].map((offset) => {
        const totalMinutes = flooredQuarter.getHours() * 60 + flooredQuarter.getMinutes() + offset * 15;
        const wrappedMinutes = ((totalMinutes % 1_440) + 1_440) % 1_440;
        const hours = Math.floor(wrappedMinutes / 60);
        const minutes = wrappedMinutes % 60;
        const localDate = createTodayTime(reference, hours, minutes);
        const value = `${padTimeUnit(hours)}:${padTimeUnit(minutes)}`;

        return {
            value,
            label: formatTimeOptionLabel(localDate),
            iso: localDate.toISOString(),
        };
    });
}

export function timeOptionValueFromIso(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return `${padTimeUnit(date.getHours())}:${padTimeUnit(date.getMinutes())}`;
}

export function isoFromTimeOptionValue(value: string, reference = new Date()): string | null {
    if (!value) {
        return null;
    }

    const [hoursPart, minutesPart] = value.split(":");
    const hours = Number(hoursPart);
    const minutes = Number(minutesPart);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return null;
    }

    return createTodayTime(reference, hours, minutes).toISOString();
}

export function formatTimeOnly(value: string | null | undefined): string {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return formatTimeOptionLabel(date);
}

export function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function formatInterval(seconds: number): string {
    return `${seconds.toLocaleString("en-US")}s`;
}
