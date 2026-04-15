"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectDisplay, disconnectDisplaySocket, updateDisplaySeq } from "../lib/socket";

export type DisplaySceneId =
    | "STANDBY"
    | "DONATIONS"
    | "TEAM_LEADERBOARD"
    | "PARTICIPANT_LEADERBOARD"
    | "ANNOUNCEMENT"
    | "MILESTONE"
    | "TOTAL";

export type DisplaySlot =
    | { type: "pinned"; scene: DisplaySceneId }
    | { type: "rotating"; scenes: Exclude<DisplaySceneId, "TOTAL">[] };

export type DisplayLayoutState = {
    layoutTemplate: string;
    slots: DisplaySlot[];
    autoCycleEnabled: boolean;
    autoCycleIntervalSec: number;
    showDonorNames: boolean;
    progressBarType: string | null;
    progressBarGoal: number | null;
    progressBarStartTime: string | null;
    progressBarEndTime: string | null;
};

export type DisplayLiveData = {
    donations: any[];
    donationsReady: boolean;
    teams: any;
    participants: any;
    hourly: any;
};

export type DisplayOverrideState = {
    scene: "TOTAL" | "ANNOUNCEMENT" | "MILESTONE";
    payload: Record<string, any>;
} | null;

export type DisplayFrameState = {
    layout: DisplayLayoutState;
    override: DisplayOverrideState;
    liveData: DisplayLiveData;
    rotatingIndices: Record<number, number>;
};

export type DisplayConnectionState = "booting" | "live" | "reconnecting" | "offline";

export type DisplayStatusState = {
    connectionState: DisplayConnectionState;
    frozen: boolean;
    hasConnected: boolean;
    hasSnapshot: boolean;
    awaitingDirectorSync: boolean;
    lastSeq: number;
};

export type DisplayRuntimeState = {
    frame: DisplayFrameState;
    status: DisplayStatusState;
};

type UseDisplayRuntimeOptions = {
    enabled?: boolean;
};

type PersistedDisplaySnapshot = {
    frame: DisplayFrameState;
    frozen: boolean;
    lastSeq: number;
    savedAt: number;
};

type OverrideSceneId = "TOTAL" | "ANNOUNCEMENT" | "MILESTONE";

const STORAGE_KEY = "display-runtime-snapshot-v1";

const DEFAULT_LAYOUT: DisplayLayoutState = {
    layoutTemplate: "FULL_SCREEN",
    slots: [{ type: "pinned", scene: "STANDBY" }],
    autoCycleEnabled: true,
    autoCycleIntervalSec: 30,
    showDonorNames: true,
    progressBarType: null,
    progressBarGoal: null,
    progressBarStartTime: null,
    progressBarEndTime: null,
};

const DEFAULT_FRAME: DisplayFrameState = {
    layout: DEFAULT_LAYOUT,
    override: null,
    liveData: {
        donations: [],
        donationsReady: false,
        teams: null,
        participants: null,
        hourly: null,
    },
    rotatingIndices: {},
};

const DEFAULT_STATUS: DisplayStatusState = {
    connectionState: "booting",
    frozen: false,
    hasConnected: false,
    hasSnapshot: false,
    awaitingDirectorSync: true,
    lastSeq: 0,
};

function createDefaultFrame(): DisplayFrameState {
    return {
        layout: {
            ...DEFAULT_LAYOUT,
            slots: [{ type: "pinned", scene: "STANDBY" }],
        },
        override: null,
        liveData: {
            donations: [],
            donationsReady: false,
            teams: null,
            participants: null,
            hourly: null,
        },
        rotatingIndices: {},
    };
}

function cloneFrame(frame: DisplayFrameState): DisplayFrameState {
    return {
        layout: {
            ...frame.layout,
            slots: frame.layout.slots.map((slot) =>
                slot.type === "pinned"
                    ? { type: "pinned", scene: slot.scene }
                    : { type: "rotating", scenes: [...slot.scenes] },
            ),
        },
        override: frame.override
            ? {
                  scene: frame.override.scene,
                  payload: { ...frame.override.payload },
              }
            : null,
        liveData: {
            donations: [],
            donationsReady: false,
            teams: frame.liveData.teams,
            participants: frame.liveData.participants,
            hourly: frame.liveData.hourly,
        },
        rotatingIndices: { ...frame.rotatingIndices },
    };
}

function createDisplayFrameFromSnapshot(snapshot: PersistedDisplaySnapshot | null): DisplayFrameState {
    if (!snapshot?.frame) {
        return createDefaultFrame();
    }

    return {
        layout: normalizeLayout(snapshot.frame.layout, DEFAULT_LAYOUT),
        override: normalizeOverride(snapshot.frame.override),
        liveData: {
            donations: [],
            donationsReady: false,
            teams: snapshot.frame.liveData?.teams ?? null,
            participants: snapshot.frame.liveData?.participants ?? null,
            hourly: snapshot.frame.liveData?.hourly ?? null,
        },
        rotatingIndices: normalizeRotatingIndices(snapshot.frame.rotatingIndices, snapshot.frame.layout?.slots ?? []),
    };
}

function isDisplaySceneId(value: unknown): value is DisplaySceneId {
    return (
        value === "STANDBY"
        || value === "DONATIONS"
        || value === "TEAM_LEADERBOARD"
        || value === "PARTICIPANT_LEADERBOARD"
        || value === "ANNOUNCEMENT"
        || value === "MILESTONE"
        || value === "TOTAL"
    );
}

function normalizeSceneId(value: unknown, allowManualTotal: boolean): DisplaySceneId {
    if (!isDisplaySceneId(value)) {
        return "STANDBY";
    }

    if (value === "TOTAL" && !allowManualTotal) {
        return "STANDBY";
    }

    return value;
}

function normalizeRotatingScenes(value: unknown): Exclude<DisplaySceneId, "TOTAL">[] {
    if (!Array.isArray(value)) {
        return ["STANDBY"];
    }

    const scenes = value
        .map((scene) => normalizeSceneId(scene, false))
        .filter((scene): scene is Exclude<DisplaySceneId, "TOTAL"> => scene !== "TOTAL");

    return scenes.length > 0 ? scenes : ["STANDBY"];
}

function normalizeSlot(slot: any): DisplaySlot {
    if (slot?.type === "rotating") {
        return {
            type: "rotating",
            scenes: normalizeRotatingScenes(slot.scenes),
        };
    }

    return {
        type: "pinned",
        scene: normalizeSceneId(slot?.scene, false),
    };
}

function getTemplateSlotCount(template: string): number {
    const normalized = template.replace("_BAR", "");

    if (normalized === "FULL_SCREEN") return 1;
    if (normalized === "MAIN_SIDEBAR") return 2;
    return 3;
}

function createDefaultSlotsForTemplate(template: string): DisplaySlot[] {
    return Array.from({ length: getTemplateSlotCount(template) }, () => ({
        type: "pinned" as const,
        scene: "STANDBY" as const,
    }));
}

function normalizeLayout(value: any, fallback: DisplayLayoutState): DisplayLayoutState {
    const template = typeof value?.layoutTemplate === "string" ? value.layoutTemplate : fallback.layoutTemplate;
    const desiredSlots = getTemplateSlotCount(template);
    const providedSlots = Array.isArray(value?.slots) && value.slots.length > 0
        ? value.slots
        : fallback.slots.length > 0
            ? fallback.slots
            : createDefaultSlotsForTemplate(template);

    const normalizedSlots = Array.from({ length: desiredSlots }, (_, index) =>
        normalizeSlot(providedSlots[index] ?? createDefaultSlotsForTemplate(template)[index]),
    );

    return {
        layoutTemplate: template,
        slots: normalizedSlots,
        autoCycleEnabled: value?.autoCycleEnabled ?? fallback.autoCycleEnabled ?? true,
        autoCycleIntervalSec: Number.isFinite(Number(value?.autoCycleIntervalSec))
            ? Math.max(5, Number(value.autoCycleIntervalSec))
            : fallback.autoCycleIntervalSec,
        showDonorNames: value?.showDonorNames ?? fallback.showDonorNames ?? true,
        progressBarType: value && "progressBarType" in value
            ? (typeof value.progressBarType === "string" ? value.progressBarType : null)
            : fallback.progressBarType,
        progressBarGoal: value && "progressBarGoal" in value
            ? (Number.isFinite(Number(value.progressBarGoal)) ? Number(value.progressBarGoal) : null)
            : fallback.progressBarGoal,
        progressBarStartTime: value && "progressBarStartTime" in value
            ? (typeof value.progressBarStartTime === "string" ? value.progressBarStartTime : null)
            : fallback.progressBarStartTime,
        progressBarEndTime: value && "progressBarEndTime" in value
            ? (typeof value.progressBarEndTime === "string" ? value.progressBarEndTime : null)
            : fallback.progressBarEndTime,
    };
}

function normalizeOverride(value: any): DisplayOverrideState {
    if (!value || typeof value.scene !== "string") {
        return null;
    }

    if (value.scene !== "TOTAL" && value.scene !== "ANNOUNCEMENT" && value.scene !== "MILESTONE") {
        return null;
    }

    return {
        scene: value.scene,
        payload: normalizeOverridePayload(value.scene, value.payload ?? value),
    };
}

function normalizeOverridePayload(scene: OverrideSceneId, payload: any): Record<string, any> {
    if (scene === "TOTAL") {
        return {
            amount: Number.isFinite(Number(payload?.amount)) ? Number(payload.amount) : 0,
        };
    }

    if (scene === "ANNOUNCEMENT") {
        return {
            message: typeof payload?.message === "string" ? payload.message : "",
            fontSize: Number.isFinite(Number(payload?.fontSize)) ? Number(payload.fontSize) : null,
        };
    }

    return {
        message: typeof payload?.message === "string" ? payload.message : "",
    };
}

function normalizeLiveDataSlice(value: any): any {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === "object") {
        return value;
    }

    return null;
}

function normalizeRotatingIndices(indices: any, slots: any[]): Record<number, number> {
    if (!indices || typeof indices !== "object") {
        return {};
    }

    const next: Record<number, number> = {};

    slots.forEach((slot, index) => {
        if (slot?.type !== "rotating") {
            return;
        }

        const size = Math.max(slot.scenes.length, 1);
        const current = Number(indices[index] ?? 0);
        next[index] = Number.isFinite(current) ? current % size : 0;
    });

    return next;
}

function isRotatingSlot(slot: DisplaySlot): slot is Extract<DisplaySlot, { type: "rotating" }> {
    return slot.type === "rotating";
}

function remapRotatingIndices(frame: DisplayFrameState): Record<number, number> {
    const next: Record<number, number> = {};

    frame.layout.slots.forEach((slot, index) => {
        if (!isRotatingSlot(slot)) {
            return;
        }

        const current = Number(frame.rotatingIndices[index] ?? 0);
        next[index] = current % Math.max(slot.scenes.length, 1);
    });

    return next;
}

function advanceRotatingIndices(frame: DisplayFrameState): Record<number, number> {
    const next = { ...frame.rotatingIndices };

    frame.layout.slots.forEach((slot, index) => {
        if (!isRotatingSlot(slot)) {
            return;
        }

        const size = Math.max(slot.scenes.length, 1);
        const current = Number(next[index] ?? 0);
        next[index] = (current + 1) % size;
    });

    return next;
}

function hasRotatingSlots(frame: DisplayFrameState): boolean {
    return frame.layout.slots.some(isRotatingSlot);
}

function extractSceneEvent(data: any): string | null {
    if (!data) {
        return null;
    }

    if (typeof data.scene === "string") {
        return data.scene;
    }

    if (typeof data.payload?.scene === "string") {
        return data.payload.scene;
    }

    return null;
}

function isPersistentOverride(scene: string): scene is OverrideSceneId {
    return scene === "TOTAL" || scene === "ANNOUNCEMENT" || scene === "MILESTONE";
}

function buildSnapshot(frame: DisplayFrameState, frozen: boolean, lastSeq: number): PersistedDisplaySnapshot {
    return {
        frame: cloneFrame(frame),
        frozen,
        lastSeq,
        savedAt: Date.now(),
    };
}

function readSnapshot(): PersistedDisplaySnapshot | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as PersistedDisplaySnapshot;
        if (!parsed || typeof parsed !== "object" || !parsed.frame) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function persistSnapshot(frame: DisplayFrameState, frozen: boolean, lastSeq: number): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot(frame, frozen, lastSeq)));
    } catch {
        // Ignore storage failures; display state can still live in memory.
    }
}

function loadInitialFrame(): { frame: DisplayFrameState; status: DisplayStatusState } {
    const snapshot = readSnapshot();

    if (!snapshot) {
        return {
            frame: createDefaultFrame(),
            status: {
                ...DEFAULT_STATUS,
                connectionState: "booting",
            },
        };
    }

    const frame = createDisplayFrameFromSnapshot(snapshot);

    return {
        frame,
        status: {
            connectionState: "booting",
            frozen: snapshot.frozen,
            hasConnected: false,
            hasSnapshot: true,
            awaitingDirectorSync: false,
            lastSeq: snapshot.lastSeq,
        },
    };
}

export function useDisplayRuntime(options: UseDisplayRuntimeOptions = {}): DisplayRuntimeState {
    const { enabled = true } = options;
    const initial = useRef(loadInitialFrame());
    const [frame, setFrame] = useState<DisplayFrameState>(initial.current.frame);
    const [status, setStatus] = useState<DisplayStatusState>(() => ({
        ...initial.current.status,
        connectionState: enabled ? initial.current.status.connectionState : "offline",
    }));

    const frameRef = useRef(frame);
    const statusRef = useRef(status);
    const socketMountedRef = useRef(false);
    const offlineTimerRef = useRef<number | null>(null);

    useEffect(() => {
        frameRef.current = frame;
    }, [frame]);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const updateStatus = useCallback((updater: (current: DisplayStatusState) => DisplayStatusState) => {
        const next = updater(statusRef.current);
        statusRef.current = next;
        setStatus(next);
    }, []);

    const updateFrame = useCallback((updater: (current: DisplayFrameState) => DisplayFrameState) => {
        const next = updater(frameRef.current);
        frameRef.current = next;
        persistSnapshot(next, statusRef.current.frozen, statusRef.current.lastSeq);

        if (!statusRef.current.frozen) {
            setFrame(next);
        }
    }, []);

    const syncFrozenState = useCallback((isFrozen: boolean) => {
        updateStatus((current) => ({
            ...current,
            frozen: isFrozen,
        }));

        persistSnapshot(frameRef.current, isFrozen, statusRef.current.lastSeq);

        if (!isFrozen) {
            setFrame(cloneFrame(frameRef.current));
        }
    }, [updateStatus]);

    const applyDirectorEvent = useCallback((data: any) => {
        const scene = extractSceneEvent(data);
        if (!scene) {
            return;
        }

        if (scene === "LAYOUT_UPDATE") {
            updateStatus((current) => ({
                ...current,
                awaitingDirectorSync: false,
            }));
            updateFrame((current) => {
                const nextLayout = normalizeLayout(data, current.layout);

                return {
                    ...current,
                    layout: nextLayout,
                    override: null,
                    rotatingIndices: remapRotatingIndices({
                        ...current,
                        layout: nextLayout,
                    }),
                };
            });
            return;
        }

        if (scene === "OVERRIDE_CLEAR") {
            updateStatus((current) => ({
                ...current,
                awaitingDirectorSync: false,
            }));
            updateFrame((current) => ({
                ...current,
                override: null,
            }));
            return;
        }

        if (isPersistentOverride(scene)) {
            updateFrame((current) => ({
                ...current,
                override: {
                    scene,
                    payload: normalizeOverridePayload(scene, data?.payload ?? data),
                },
            }));
        }

        updateStatus((current) => ({
            ...current,
            awaitingDirectorSync: false,
        }));
    }, [updateFrame]);

    const applyLiveData = useCallback((kind: "donations" | "teams" | "participants" | "hourly", data: any) => {
        updateFrame((current) => ({
            ...current,
            liveData: {
                ...current.liveData,
                [kind]: normalizeLiveDataSlice(data),
                ...(kind === "donations" ? { donationsReady: true } : {}),
            },
        }));
    }, [updateFrame]);

    useEffect(() => {
        if (!enabled) {
            updateStatus((current) => ({
                ...current,
                connectionState: "offline",
            }));
            return;
        }

        if (socketMountedRef.current) {
            return;
        }

        socketMountedRef.current = true;
        updateStatus((current) => ({
            ...current,
            connectionState: current.hasConnected ? "reconnecting" : "booting",
        }));

        const socket = connectDisplay();

        const handleConnect = () => {
            if (offlineTimerRef.current) {
                window.clearTimeout(offlineTimerRef.current);
                offlineTimerRef.current = null;
            }
            updateStatus((current) => ({
                ...current,
                connectionState: "live",
                hasConnected: true,
            }));
        };

        const handleDisconnect = () => {
            updateStatus((current) => ({
                ...current,
                connectionState: current.hasConnected ? "reconnecting" : "offline",
            }));

            if (statusRef.current.hasConnected) {
                if (offlineTimerRef.current) {
                    window.clearTimeout(offlineTimerRef.current);
                }

                offlineTimerRef.current = window.setTimeout(() => {
                    updateStatus((current) => ({
                        ...current,
                        connectionState: current.connectionState === "live" ? current.connectionState : "offline",
                    }));
                }, 8000);
            }
        };

        const handleFreeze = (data: { frozen: boolean }) => {
            syncFrozenState(Boolean(data?.frozen));
            updateStatus((current) => ({
                ...current,
                awaitingDirectorSync: false,
            }));
        };

        const handleReplay = (events: any[]) => {
            if (!Array.isArray(events)) {
                return;
            }

            for (const event of events) {
                if (typeof event?.seq === "number") {
                    updateDisplaySeq(event.seq);
                    updateStatus((current) => ({
                        ...current,
                        lastSeq: Math.max(current.lastSeq, event.seq),
                        awaitingDirectorSync: false,
                    }));
                }

                applyDirectorEvent(event?.payload ?? event);
            }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("director:scene", applyDirectorEvent);
        socket.on("director:replay", handleReplay);
        socket.on("director:freeze", handleFreeze);
        socket.on("live:donations", (data) => applyLiveData("donations", data));
        socket.on("live:teams", (data) => applyLiveData("teams", data));
        socket.on("live:participants", (data) => applyLiveData("participants", data));
        socket.on("live:hourly", (data) => applyLiveData("hourly", data));

        return () => {
            if (offlineTimerRef.current) {
                window.clearTimeout(offlineTimerRef.current);
                offlineTimerRef.current = null;
            }
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("director:scene", applyDirectorEvent);
            socket.off("director:replay", handleReplay);
            socket.off("director:freeze", handleFreeze);
            socket.off("live:donations");
            socket.off("live:teams");
            socket.off("live:participants");
            socket.off("live:hourly");
            disconnectDisplaySocket();
            socketMountedRef.current = false;
        };
    }, [applyDirectorEvent, applyLiveData, enabled, syncFrozenState, updateStatus]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const rotationKey = frame.layout.slots
            .map((slot) => (slot.type === "pinned" ? `p:${slot.scene}` : `r:${slot.scenes.join(",")}`))
            .join("|");

        const canRotate =
            status.connectionState === "live"
            && !status.frozen
            && !frame.override
            && frame.layout.autoCycleEnabled
            && hasRotatingSlots(frame);

        if (!canRotate) {
            return;
        }

        const intervalMs = Math.max(5, frame.layout.autoCycleIntervalSec) * 1000;

        const tick = () => {
            const current = frameRef.current;

            if (
                statusRef.current.frozen
                || statusRef.current.connectionState !== "live"
                || !current.layout.autoCycleEnabled
                || current.override
                || !hasRotatingSlots(current)
            ) {
                return;
            }

            const next: DisplayFrameState = {
                ...current,
                rotatingIndices: advanceRotatingIndices(current),
            };

            frameRef.current = next;
            setFrame(next);
            persistSnapshot(next, statusRef.current.frozen, statusRef.current.lastSeq);
        };

        const interval = window.setInterval(tick, intervalMs);
        return () => window.clearInterval(interval);
    }, [enabled, frame.layout.autoCycleEnabled, frame.layout.autoCycleIntervalSec, frame.layout.slots, frame.override, status.connectionState, status.frozen]);

    return {
        frame,
        status,
    };
}
