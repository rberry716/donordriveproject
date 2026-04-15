"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConsole } from "../../../components/admin/AdminConsole";
import { buildSlotsForTemplate } from "../../../components/admin/utils";
import type { LayoutTemplate, ProgressBarType, SceneId, SlotConfig } from "../../../components/admin/types";
import { authFetch, handleAuthFailure } from "../../../lib/auth-fetch";
import { getAccessToken } from "../../../lib/auth-storage";

type Slot = SlotConfig;

type DisplayState = {
    id: string;
    layoutTemplate: LayoutTemplate;
    slots: Slot[];
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
};

const TEMPLATES = [
    { value: "FULL_SCREEN", label: "Full Screen", cols: 1, hasBar: false },
    { value: "FULL_SCREEN_BAR", label: "Full Screen + Bar", cols: 1, hasBar: true },
    { value: "THREE_COLUMN", label: "Three Column", cols: 3, hasBar: false },
    { value: "THREE_COLUMN_BAR", label: "Three Column + Bar", cols: 3, hasBar: true },
    { value: "MAIN_SIDEBAR", label: "Main + Sidebar", cols: 2, hasBar: false },
    { value: "MAIN_SIDEBAR_BAR", label: "Main + Sidebar + Bar", cols: 2, hasBar: true },
];

const SCENES = ["STANDBY", "DONATIONS", "TEAM_LEADERBOARD", "PARTICIPANT_LEADERBOARD", "ANNOUNCEMENT", "MILESTONE"] as const satisfies readonly SceneId[];

const SLOT_COUNTS: Record<string, number> = {
    FULL_SCREEN: 1, FULL_SCREEN_BAR: 1,
    THREE_COLUMN: 3, THREE_COLUMN_BAR: 3,
    MAIN_SIDEBAR: 2, MAIN_SIDEBAR_BAR: 2,
};

function authHeaders(): Record<string, string> {
    const token = getAccessToken();

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function is401(res: Response, router: { push: (path: string) => void }): boolean {
    if (res.status === 401) {
        handleAuthFailure(router);
        return true;
    }
    return false;
}

const DRAFT_FIELDS = [
    "layoutTemplate",
    "slots",
    "progressBarType",
    "progressBarGoal",
    "progressBarStartTime",
    "progressBarEndTime",
    "autoCycleEnabled",
    "autoCycleIntervalSec",
    "showDonorNames",
] as const satisfies readonly (keyof DisplayState)[];

function buildDraftPayload(state: DisplayState): Pick<DisplayState, (typeof DRAFT_FIELDS)[number]> {
    const payload: Pick<DisplayState, (typeof DRAFT_FIELDS)[number]> = {
        layoutTemplate: state.layoutTemplate,
        slots: state.slots,
        progressBarType: null,
        progressBarGoal: null,
        progressBarStartTime: null,
        progressBarEndTime: null,
        autoCycleEnabled: state.autoCycleEnabled,
        autoCycleIntervalSec: state.autoCycleIntervalSec,
        showDonorNames: state.showDonorNames,
    };

    if (state.layoutTemplate.endsWith("_BAR")) {
        payload.progressBarType = state.progressBarType;
        payload.progressBarGoal = state.progressBarGoal;
        payload.progressBarStartTime = state.progressBarStartTime;
        payload.progressBarEndTime = state.progressBarEndTime;
    }

    return payload;
}

function draftSignature(state: DisplayState | null): string {
    if (!state) {
        return "";
    }

    return JSON.stringify(buildDraftPayload(state));
}

function TemplateCard({ template, selected, onSelect }: { template: typeof TEMPLATES[0]; selected: boolean; onSelect: () => void }) {
    const baseTemplate = template.value.replace("_BAR", "");
    const widths = baseTemplate === "FULL_SCREEN" ? ["100%"]
        : baseTemplate === "MAIN_SIDEBAR" ? ["66%", "34%"]
        : ["33%", "34%", "33%"];

    return (
        <button onClick={onSelect}
                className="p-3 rounded-lg transition-all duration-200"
                style={{
                    background: selected ? "var(--accent)" : "var(--bg-secondary)",
                    border: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
                    opacity: selected ? 1 : 0.7,
                }}>
            <div className="flex gap-1 h-12 mb-2">
                {widths.map((w, i) => (
                    <div key={i} className="rounded" style={{ width: w, background: "rgba(255,255,255,0.1)" }} />
                ))}
            </div>
            {template.hasBar && (
                <div className="h-2 rounded mt-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            )}
            <p className="text-xs mt-2" style={{ color: selected ? "white" : "var(--text-secondary)" }}>
                {template.label}
            </p>
        </button>
    );
}

function SlotBuilder({ slots, onChange }: { slots: Slot[]; onChange: (slots: Slot[]) => void }) {
    function updateSlot(index: number, slot: Slot) {
        const next = [...slots];
        next[index] = slot;
        onChange(next);
    }

    function toggleType(index: number) {
        const current = slots[index];
        if (current.type === "pinned") {
            updateSlot(index, { type: "rotating", scenes: [current.scene] });
        } else {
            updateSlot(index, { type: "pinned", scene: current.scenes[0] || "STANDBY" });
        }
    }

    function setPinnedScene(index: number, scene: SceneId) {
        updateSlot(index, { type: "pinned", scene });
    }

    function toggleRotatingScene(index: number, scene: SceneId) {
        const slot = slots[index];
        if (slot.type !== "rotating") return;
        const scenes = slot.scenes.includes(scene)
            ? slot.scenes.filter(s => s !== scene)
            : [...slot.scenes, scene];
        if (scenes.length === 0) return;
        updateSlot(index, { type: "rotating", scenes });
    }

    function moveScene(slotIndex: number, sceneIndex: number, direction: -1 | 1) {
        const slot = slots[slotIndex];
        if (slot.type !== "rotating") return;
        const target = sceneIndex + direction;
        if (target < 0 || target >= slot.scenes.length) return;
        const scenes = [...slot.scenes];
        [scenes[sceneIndex], scenes[target]] = [scenes[target], scenes[sceneIndex]];
        updateSlot(slotIndex, { type: "rotating", scenes });
    }

    return (
        <div className="flex flex-col gap-4">
            {slots.map((slot, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            Slot {i + 1}
                        </span>
                        <button onClick={() => toggleType(i)}
                                className="text-xs px-3 py-1 rounded-full"
                                style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                            {slot.type === "pinned" ? "Pinned" : "Rotating"}
                        </button>
                    </div>

                    {slot.type === "pinned" ? (
                        <select value={slot.scene}
                                onChange={(e) => setPinnedScene(i, e.target.value as SceneId)}
                                className="w-full px-3 py-2 rounded text-sm outline-none"
                                style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
                            {SCENES.map(s => (
                                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                            ))}
                        </select>
                    ) : (
                        <div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {SCENES.map(s => (
                                    <button key={s}
                                            onClick={() => toggleRotatingScene(i, s)}
                                            className="text-xs px-3 py-1 rounded-full transition-all"
                                            style={{
                                                background: slot.scenes.includes(s) ? "var(--accent)" : "rgba(255,255,255,0.05)",
                                                color: slot.scenes.includes(s) ? "white" : "var(--text-secondary)",
                                            }}>
                                        {s.replace(/_/g, " ")}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1">
                                {slot.scenes.map((s, si) => (
                                    <div key={s} className="flex items-center gap-2 px-3 py-1 rounded text-sm"
                                         style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
                                        <span className="flex-1">{si + 1}. {s.replace(/_/g, " ")}</span>
                                        <button onClick={() => moveScene(i, si, -1)}
                                                disabled={si === 0}
                                                className="opacity-50 hover:opacity-100 disabled:opacity-20">↑</button>
                                        <button onClick={() => moveScene(i, si, 1)}
                                                disabled={si === slot.scenes.length - 1}
                                                className="opacity-50 hover:opacity-100 disabled:opacity-20">↓</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboard() {
    const router = useRouter();
    const [liveState, setLiveState] = useState<DisplayState | null>(null);
    const [draftState, setDraftState] = useState<DisplayState | null>(null);
    const [connectedCount, setConnectedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [telemetryHealthy, setTelemetryHealthy] = useState(true);
    const [telemetryError, setTelemetryError] = useState<string | null>(null);
    const [lastStateSyncAt, setLastStateSyncAt] = useState<string | null>(null);
    const [lastTelemetryAt, setLastTelemetryAt] = useState<string | null>(null);
    const [error, setError] = useState("");
    const hasPendingChanges = useMemo(
        () => draftSignature(liveState) !== draftSignature(draftState),
        [draftState, liveState],
    );
    const dirtyRef = useRef(false);

    useEffect(() => {
        dirtyRef.current = hasPendingChanges;
    }, [hasPendingChanges]);

    const ingestServerState = useCallback((nextState: DisplayState, syncDraft = !dirtyRef.current) => {
        setLiveState(nextState);
        setDraftState((current) => (syncDraft || current === null ? nextState : current));
        setLastStateSyncAt(new Date().toISOString());
    }, []);

    const fetchState = useCallback(async () => {
        try {
            const res = await authFetch("/api/display/state");
            if (is401(res, router)) return;

            const data = await res.json();
            ingestServerState(data);
        } catch {
            setError("Failed to load display state");
        } finally {
            setLoading(false);
        }
    }, [ingestServerState, router]);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await authFetch("/api/display/status");
            if (is401(res, router)) return;

            if (!res.ok) {
                setTelemetryHealthy(false);
                setTelemetryError("Operational telemetry poll failed");
                return;
            }

            const data = await res.json();
            setConnectedCount(data.connectedCount);
            setTelemetryHealthy(true);
            setTelemetryError(null);
            setLastTelemetryAt(new Date().toISOString());
        } catch {
            setTelemetryHealthy(false);
            setTelemetryError("Operational telemetry poll failed");
        }
    }, [router]);

    useEffect(() => {
        if (!getAccessToken()) {
            router.push("/admin");
            return;
        }

        fetchState();
        fetchStatus();

        const stateInterval = setInterval(fetchState, 20000);
        const statusInterval = setInterval(fetchStatus, 10000);

        return () => {
            clearInterval(stateInterval);
            clearInterval(statusInterval);
        };
    }, [router, fetchState, fetchStatus]);

    const updateDraftState = useCallback((updates: Partial<DisplayState>) => {
        setDraftState((current) => (current ? { ...current, ...updates } : current));
        setError("");
    }, []);

    const saveDraftState = useCallback(async () => {
        if (!draftState) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await authFetch("/api/display/state", {
                method: "PATCH",
                body: JSON.stringify(buildDraftPayload(draftState)),
            });
            if (is401(res, router)) return;

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Failed to send scene" }));
                setError(data.error || "Failed to send scene");
                return;
            }

            const data = await res.json();
            ingestServerState(data, true);
        } catch {
            setError("Connection error");
        } finally {
            setSaving(false);
        }
    }, [draftState, ingestServerState, router]);

    const pushOverride = useCallback(async (scene: "ANNOUNCEMENT" | "MILESTONE" | "TOTAL", payload: Record<string, unknown>) => {
        setError("");
        setSaving(true);

        try {
            const res = await authFetch("/api/display/override", {
                method: "POST",
                body: JSON.stringify({ scene, payload }),
            });
            if (is401(res, router)) return;

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Failed to push override" }));
                setError(data.error || "Failed to push override");
                return;
            }

            const data = await res.json();
            ingestServerState(data, !dirtyRef.current);
        } catch {
            setError("Connection error");
        } finally {
            setSaving(false);
        }
    }, [ingestServerState, router]);

    const clearOverride = useCallback(async () => {
        setError("");
        setSaving(true);

        try {
            const res = await authFetch("/api/display/override", { method: "DELETE" });
            if (is401(res, router)) return;

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Failed to clear override" }));
                setError(data.error || "Failed to clear override");
                return;
            }

            const data = await res.json();
            ingestServerState(data, !dirtyRef.current);
        } catch {
            setError("Connection error");
        } finally {
            setSaving(false);
        }
    }, [ingestServerState, router]);

    const toggleFreeze = useCallback(async () => {
        setError("");
        setSaving(true);

        try {
            const res = await authFetch("/api/display/freeze", { method: "POST" });
            if (is401(res, router)) return;

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Failed to update freeze state" }));
                setError(data.error || "Failed to update freeze state");
                return;
            }

            const data = await res.json();
            ingestServerState(data, !dirtyRef.current);
        } catch {
            setError("Connection error");
        } finally {
            setSaving(false);
        }
    }, [ingestServerState, router]);

    const sendStandby = useCallback(async () => {
        setError("");
        setSaving(true);

        try {
            const res = await authFetch("/api/display/state", {
                method: "PATCH",
                body: JSON.stringify({
                    layoutTemplate: "FULL_SCREEN",
                    slots: [{ type: "pinned", scene: "STANDBY" }],
                } satisfies Pick<DisplayState, "layoutTemplate" | "slots">),
            });
            if (is401(res, router)) return;

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Failed to send standby" }));
                setError(data.error || "Failed to send standby");
                return;
            }

            const data = await res.json();
            ingestServerState(data, !dirtyRef.current);
        } catch {
            setError("Connection error");
        } finally {
            setSaving(false);
        }
    }, [ingestServerState, router]);

    const handleTemplateChange = useCallback((template: LayoutTemplate) => {
        setDraftState((current) => {
            if (!current) {
                return current;
            }

            const newSlots: Slot[] = buildSlotsForTemplate(template, current.slots);
            return {
                ...current,
                layoutTemplate: template,
                slots: newSlots,
            };
        });
        setError("");
    }, []);

    const handleSlotsChange = useCallback((slots: SlotConfig[]) => {
        updateDraftState({ slots });
    }, [updateDraftState]);

    const handleResetChanges = useCallback(() => {
        if (!liveState) {
            return;
        }

        setDraftState(liveState);
        setError("");
    }, [liveState]);

    if (loading && !liveState) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#edf5ff] px-4 text-[#0b3e86]">
                <div className="rounded-[28px] border-4 border-[#f1c93a] bg-[#fffef8] px-7 py-6 shadow-[0_20px_40px_rgba(11,78,162,0.12)]">
                    <div className="text-[10px] uppercase tracking-[0.34em] text-[#0b4ea2]">
                        Loading
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[0.06em]">Opening the admin board</div>
                    <div className="mt-2 text-sm text-[#5a75a8]">Pulling the live display state and current status.</div>
                </div>
            </div>
        );
    }

    if (!liveState || !draftState) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#edf5ff] px-4 text-[#0b3e86]">
                <div className="rounded-[28px] border-4 border-[#f1c93a] bg-[#fffef8] px-7 py-6 shadow-[0_20px_40px_rgba(11,78,162,0.12)]">
                    <div className="text-[10px] uppercase tracking-[0.34em] text-[#c65349]">
                        Unavailable
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[0.06em]">The admin board could not load</div>
                    <div className="mt-2 text-sm text-[#5a75a8]">Refresh the page or sign in again.</div>
                </div>
            </div>
        );
    }

    return (
        <AdminConsole
            state={draftState}
            liveState={liveState}
            connectedCount={connectedCount}
            lastStateSyncAt={lastStateSyncAt}
            lastTelemetryAt={lastTelemetryAt}
            telemetryHealthy={telemetryHealthy}
            telemetryError={telemetryError}
            error={error}
            saving={saving}
            hasPendingChanges={hasPendingChanges}
            onRefresh={() => {
                void fetchState();
                void fetchStatus();
            }}
            onTemplateChange={handleTemplateChange}
            onSlotsChange={handleSlotsChange}
            onUpdateState={updateDraftState}
            onApplyChanges={() => {
                void saveDraftState();
            }}
            onResetChanges={handleResetChanges}
            onPushOverride={pushOverride}
            onClearOverride={() => {
                void clearOverride();
            }}
            onToggleFreeze={() => {
                void toggleFreeze();
            }}
            onSendStandby={() => {
                void sendStandby();
            }}
        />
    );
}
