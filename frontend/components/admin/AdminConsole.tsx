"use client";

import { useState } from "react";
import type {
    CSSProperties,
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";
import type { DisplayState, LayoutTemplate, SceneId, SlotConfig } from "./types";
import {
    SCENE_OPTIONS,
    buildQuarterHourOptions,
    clampNumber,
    formatDateTime,
    formatInterval,
    formatTimeOnly,
    isoFromTimeOptionValue,
    sceneLabel,
    templateHasBar,
    templateLabel,
    templatePreviewSegments,
    timeOptionValueFromIso,
} from "./utils";

const PALETTE = {
    bg: "#F9FCFF",
    panel: "#FFFFFF",
    panelAlt: "#F7FBFF",
    wash: "#EAF2FF",
    washStrong: "#D7E8FF",
    line: "rgba(11, 78, 162, 0.14)",
    lineStrong: "rgba(11, 78, 162, 0.28)",
    text: "#0B3E86",
    muted: "#5A75A8",
    cyan: "#0B4EA2",
    amber: "#E7B919",
    amberSoft: "rgba(231, 185, 25, 0.14)",
    cyanSoft: "rgba(11, 78, 162, 0.10)",
    red: "#C65349",
    redSoft: "rgba(198, 83, 73, 0.14)",
    green: "#158C59",
    header: "rgba(255, 255, 255, 0.94)",
    shadow: "0 14px 28px rgba(11, 78, 162, 0.08)",
};

type AdminConsoleProps = {
    state: DisplayState;
    liveState: DisplayState;
    connectedCount: number;
    lastStateSyncAt: string | null;
    lastTelemetryAt: string | null;
    telemetryHealthy: boolean;
    telemetryError: string | null;
    error: string | null;
    saving: boolean;
    hasPendingChanges: boolean;
    onRefresh: () => void;
    onTemplateChange: (template: LayoutTemplate) => void;
    onSlotsChange: (slots: SlotConfig[]) => void;
    onUpdateState: (updates: Partial<DisplayState>) => void;
    onApplyChanges: () => void;
    onResetChanges: () => void;
    onPushOverride: (scene: "ANNOUNCEMENT" | "MILESTONE" | "TOTAL", payload: Record<string, unknown>) => void;
    onClearOverride: () => void;
    onToggleFreeze: () => void;
    onSendStandby: () => void;
};

type ButtonVariant = "primary" | "secondary" | "ghost" | "amber" | "danger";

function buttonStyle(variant: ButtonVariant, active = false): CSSProperties {
    switch (variant) {
        case "primary":
            return {
                background: active ? PALETTE.cyan : PALETTE.cyanSoft,
                color: active ? "#FFFDF7" : PALETTE.text,
                borderColor: active ? PALETTE.cyan : PALETTE.lineStrong,
            };
        case "secondary":
            return {
                background: active ? PALETTE.washStrong : PALETTE.panelAlt,
                color: active ? PALETTE.amber : PALETTE.text,
                borderColor: active ? PALETTE.amber : PALETTE.line,
            };
        case "amber":
            return {
                background: active ? PALETTE.amber : PALETTE.amberSoft,
                color: active ? "#FFFDF7" : PALETTE.amber,
                borderColor: active ? PALETTE.amber : "rgba(255,176,0,0.4)",
            };
        case "danger":
            return {
                background: active ? PALETTE.red : PALETTE.redSoft,
                color: active ? "#FFFDF7" : PALETTE.red,
                borderColor: active ? PALETTE.red : "rgba(255,107,107,0.35)",
            };
        default:
            return {
                background: active ? PALETTE.cyanSoft : PALETTE.panelAlt,
                color: active ? PALETTE.cyan : PALETTE.text,
                borderColor: active ? PALETTE.cyan : PALETTE.line,
            };
    }
}

function Panel({
    title,
    eyebrow,
    children,
    className = "",
}: {
    title: string;
    eyebrow: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`overflow-hidden rounded-[18px] border ${className}`}
            style={{
                borderColor: PALETTE.line,
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,252,244,0.98)), linear-gradient(180deg, rgba(247,251,255,0.96), rgba(255,253,247,0.98))",
                boxShadow: PALETTE.shadow,
            }}
        >
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: PALETTE.line }}>
                <div>
                    <div className="text-[10px] uppercase tracking-[0.42em]" style={{ color: PALETTE.cyan }}>
                        {eyebrow}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold tracking-[0.18em]" style={{ color: PALETTE.text }}>
                        {title}
                    </h2>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function MetricTile({
    label,
    value,
    detail,
    tone = "default",
}: {
    label: string;
    value: string;
    detail?: string;
    tone?: "default" | "cyan" | "amber" | "danger" | "green";
}) {
    const accent =
        tone === "cyan" ? PALETTE.cyan : tone === "amber" ? PALETTE.amber : tone === "danger" ? PALETTE.red : tone === "green" ? PALETTE.green : PALETTE.muted;

    return (
        <div
            className="rounded-[14px] border px-4 py-3"
            style={{
                borderColor: PALETTE.line,
                background: PALETTE.panelAlt,
            }}
        >
            <div className="text-[10px] uppercase tracking-[0.36em]" style={{ color: PALETTE.muted }}>
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[0.14em] tabular-nums" style={{ color: accent }}>
                {value}
            </div>
            {detail ? (
                <div className="mt-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: PALETTE.muted }}>
                    {detail}
                </div>
            ) : null}
        </div>
    );
}

function ActionButton({
    children,
    onClick,
    variant = "ghost",
    active = false,
    disabled = false,
    className = "",
    type = "button",
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: ButtonVariant;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit";
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-[12px] border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
            style={buttonStyle(variant, active)}
        >
            {children}
        </button>
    );
}

function Label({
    title,
    hint,
}: {
    title: string;
    hint?: string;
}) {
    return (
        <div className="mb-2">
            <div className="text-[10px] uppercase tracking-[0.38em]" style={{ color: PALETTE.muted }}>
                {title}
            </div>
            {hint ? (
                <div className="mt-1 text-[11px] uppercase tracking-[0.24em]" style={{ color: PALETTE.muted }}>
                    {hint}
                </div>
            ) : null}
        </div>
    );
}

function InputShell({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <Label title={label} hint={hint} />
            {children}
        </div>
    );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`w-full rounded-[12px] border px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-[rgba(67,229,255,0.7)] ${props.className || ""}`}
            style={{
                background: "#FFFFFF",
                borderColor: PALETTE.line,
                color: PALETTE.text,
            }}
        />
    );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={`w-full rounded-[12px] border px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-[rgba(67,229,255,0.7)] ${props.className || ""}`}
            style={{
                background: "#FFFFFF",
                borderColor: PALETTE.line,
                color: PALETTE.text,
            }}
        />
    );
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`w-full rounded-[12px] border px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-[rgba(67,229,255,0.7)] ${props.className || ""}`}
            style={{
                background: "#FFFFFF",
                borderColor: PALETTE.line,
                color: PALETTE.text,
            }}
        />
    );
}

function TemplateMatrix({
    template,
    onSelect,
}: {
    template: LayoutTemplate;
    onSelect: (template: LayoutTemplate) => void;
}) {
    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(["FULL_SCREEN", "FULL_SCREEN_BAR", "THREE_COLUMN", "THREE_COLUMN_BAR", "MAIN_SIDEBAR", "MAIN_SIDEBAR_BAR"] as LayoutTemplate[]).map((optionTemplate) => {
                const selected = template === optionTemplate;
                const segments = templatePreviewSegments(optionTemplate);
                const bar = templateHasBar(optionTemplate);

                return (
                    <button
                        key={optionTemplate}
                        type="button"
                        onClick={() => onSelect(optionTemplate)}
                        className="rounded-[14px] border p-3 text-left transition-all duration-200"
                        style={{
                            borderColor: selected ? PALETTE.cyan : PALETTE.line,
                            background: selected ? PALETTE.cyanSoft : PALETTE.panelAlt,
                            boxShadow: selected ? "0 0 0 1px rgba(29,122,140,0.18)" : "none",
                        }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.muted }}>
                                    Template
                                </div>
                                <div className="mt-1 text-sm font-semibold tracking-[0.14em]" style={{ color: PALETTE.text }}>
                                    {templateLabel(optionTemplate)}
                                </div>
                            </div>
                            <div
                                className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.3em]"
                                style={{
                                    borderColor: bar ? PALETTE.amber : PALETTE.line,
                                    color: bar ? PALETTE.amber : PALETTE.muted,
                                    background: bar ? PALETTE.amberSoft : "transparent",
                                }}
                            >
                                {bar ? "Bar" : "No Bar"}
                            </div>
                        </div>
                        <div className="mt-4 flex h-14 gap-1.5">
                            {segments.map((segment, index) => (
                                <div
                                    key={`${optionTemplate}-${index}`}
                                    className="h-full rounded-[4px]"
                                    style={{
                                        width: `${segment}%`,
                                        background: selected ? "rgba(11,78,162,0.68)" : "rgba(241,201,58,0.28)",
                                    }}
                                />
                            ))}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function SlotProgrammer({
    slots,
    onChange,
}: {
    slots: SlotConfig[];
    onChange: (slots: SlotConfig[]) => void;
}) {
    const updateSlot = (index: number, nextSlot: SlotConfig) => {
        const next = [...slots];
        next[index] = nextSlot;
        onChange(next);
    };

    const toggleSlotMode = (index: number) => {
        const current = slots[index];

        if (current.type === "pinned") {
            updateSlot(index, { type: "rotating", scenes: [current.scene] });
            return;
        }

        updateSlot(index, { type: "pinned", scene: current.scenes[0] || "STANDBY" });
    };

    const toggleRotatingScene = (slotIndex: number, scene: SceneId) => {
        const slot = slots[slotIndex];
        if (slot.type !== "rotating") {
            return;
        }

        const nextScenes = slot.scenes.includes(scene)
            ? slot.scenes.filter((value) => value !== scene)
            : [...slot.scenes, scene];

        if (nextScenes.length === 0) {
            return;
        }

        updateSlot(slotIndex, { type: "rotating", scenes: nextScenes });
    };

    const reorderRotatingScene = (slotIndex: number, sceneIndex: number, direction: -1 | 1) => {
        const slot = slots[slotIndex];
        if (slot.type !== "rotating") {
            return;
        }

        const target = sceneIndex + direction;
        if (target < 0 || target >= slot.scenes.length) {
            return;
        }

        const scenes = [...slot.scenes];
        [scenes[sceneIndex], scenes[target]] = [scenes[target], scenes[sceneIndex]];
        updateSlot(slotIndex, { type: "rotating", scenes });
    };

    return (
        <div className="space-y-3">
            {slots.map((slot, index) => (
                <div
                    key={`slot-${index}`}
                    className="rounded-[14px] border p-4"
                    style={{
                        borderColor: PALETTE.line,
                        background: PALETTE.wash,
                    }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.38em]" style={{ color: PALETTE.muted }}>
                                Slot {String(index + 1).padStart(2, "0")}
                            </div>
                            <div className="mt-1 text-sm tracking-[0.16em]" style={{ color: PALETTE.text }}>
                                {slot.type === "pinned" ? sceneLabel(slot.scene) : `${slot.scenes.length} scenes queued`}
                            </div>
                        </div>
                        <ActionButton
                            variant={slot.type === "pinned" ? "ghost" : "amber"}
                            active={slot.type === "rotating"}
                            onClick={() => toggleSlotMode(index)}
                        >
                            {slot.type === "pinned" ? "Pinned" : "Rotating"}
                        </ActionButton>
                    </div>

                    {slot.type === "pinned" ? (
                        <div className="mt-4">
                            <InputShell label="Pinned scene" hint="A single scene that holds this slot.">
                                <SelectInput
                                    value={slot.scene}
                                    onChange={(event) => updateSlot(index, { type: "pinned", scene: event.target.value as SceneId })}
                                >
                                    {SCENE_OPTIONS.map((scene) => (
                                        <option key={scene} value={scene}>
                                            {sceneLabel(scene)}
                                        </option>
                                    ))}
                                </SelectInput>
                            </InputShell>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {SCENE_OPTIONS.map((scene) => {
                                    const selected = slot.scenes.includes(scene);
                                    return (
                                        <button
                                            key={`${index}-${scene}`}
                                            type="button"
                                            onClick={() => toggleRotatingScene(index, scene)}
                                            className="rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.26em] transition-all duration-200"
                                            style={{
                                                borderColor: selected ? PALETTE.cyan : PALETTE.line,
                                                background: selected ? PALETTE.cyanSoft : PALETTE.panelAlt,
                                                color: selected ? PALETTE.cyan : PALETTE.muted,
                                            }}
                                        >
                                            {sceneLabel(scene)}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2">
                                {slot.scenes.map((scene, sceneIndex) => (
                                    <div
                                        key={`${index}-${scene}`}
                                        className="flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2"
                                        style={{
                                            borderColor: PALETTE.line,
                                            background: PALETTE.panelAlt,
                                        }}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.muted }}>
                                                Queue {sceneIndex + 1}
                                            </div>
                                            <div className="truncate text-sm tracking-[0.12em]" style={{ color: PALETTE.text }}>
                                                {sceneLabel(scene)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ActionButton
                                                variant="ghost"
                                                disabled={sceneIndex === 0}
                                                onClick={() => reorderRotatingScene(index, sceneIndex, -1)}
                                            >
                                                ^
                                            </ActionButton>
                                            <ActionButton
                                                variant="ghost"
                                                disabled={sceneIndex === slot.scenes.length - 1}
                                                onClick={() => reorderRotatingScene(index, sceneIndex, 1)}
                                            >
                                                v
                                            </ActionButton>
                                        </div>
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

function BarConfigPanel({
    state,
    onUpdateState,
}: {
    state: DisplayState;
    onUpdateState: (updates: Partial<DisplayState>) => void;
}) {
    const hasBar = templateHasBar(state.layoutTemplate);
    const timeOptions = buildQuarterHourOptions();
    const startValue = timeOptionValueFromIso(state.progressBarStartTime);
    const endValue = timeOptionValueFromIso(state.progressBarEndTime);
    const withSelectedValue = (selectedValue: string, isoValue: string | null) => {
        if (!selectedValue || timeOptions.some((option) => option.value === selectedValue)) {
            return timeOptions;
        }

        return [
            {
                value: selectedValue,
                label: `Saved: ${formatTimeOnly(isoValue)}`,
                iso: isoValue || "",
            },
            ...timeOptions,
        ];
    };
    const startOptions = withSelectedValue(startValue, state.progressBarStartTime);
    const endOptions = withSelectedValue(endValue, state.progressBarEndTime);
    const todayLabel = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(new Date());

    return (
        <div className="grid gap-3 xl:grid-cols-2">
            <InputShell label="Progress bar type" hint="Choose what the live bar should measure.">
                <SelectInput
                    value={state.progressBarType || ""}
                    onChange={(event) =>
                        onUpdateState({
                            progressBarType: (event.target.value || null) as DisplayState["progressBarType"],
                        })
                    }
                >
                    <option value="">Select type</option>
                    <option value="PERIOD_TOTAL">Period total</option>
                    <option value="DONATION_COUNT">Donation count</option>
                </SelectInput>
            </InputShell>

            <InputShell label="Goal" hint="Target for the live bar.">
                <TextInput
                    type="number"
                    inputMode="decimal"
                    value={state.progressBarGoal ?? ""}
                    onChange={(event) => {
                        const next = event.target.value === "" ? null : Number(event.target.value);
                        onUpdateState({
                            progressBarGoal: typeof next === "number" && Number.isFinite(next) ? next : null,
                        });
                    }}
                />
            </InputShell>

            <InputShell label="Start time" hint={`Quarter-hour dropdown saved on ${todayLabel}.`}>
                <SelectInput
                    value={startValue}
                    onChange={(event) =>
                        onUpdateState({
                            progressBarStartTime: isoFromTimeOptionValue(event.target.value),
                        })
                    }
                >
                    <option value="">Choose a start time</option>
                    {startOptions.map((option) => (
                        <option key={`start-${option.value}`} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
            </InputShell>

            <InputShell label="End time" hint={`Quarter-hour dropdown saved on ${todayLabel}.`}>
                <SelectInput
                    value={endValue}
                    onChange={(event) =>
                        onUpdateState({
                            progressBarEndTime: isoFromTimeOptionValue(event.target.value),
                        })
                    }
                >
                    <option value="">Choose an end time</option>
                    {endOptions.map((option) => (
                        <option key={`end-${option.value}`} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SelectInput>
            </InputShell>

            <div className="xl:col-span-2 rounded-[14px] border px-4 py-3" style={{ borderColor: PALETTE.line, background: PALETTE.wash }}>
                <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.muted }}>
                    Rail status
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                        className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.28em]"
                        style={{
                            borderColor: hasBar ? PALETTE.amber : PALETTE.line,
                            background: hasBar ? PALETTE.amberSoft : PALETTE.panelAlt,
                            color: hasBar ? PALETTE.amber : PALETTE.muted,
                        }}
                    >
                        {hasBar ? "Active on current layout" : "Stored for bar layouts"}
                    </span>
                    <span className="text-sm" style={{ color: PALETTE.muted }}>
                        These times save on today's date and stay ready whenever a bar layout is sent.
                    </span>
                </div>
            </div>
        </div>
    );
}

function TelemetryPanel({
    connectedCount,
    lastStateSyncAt,
    lastTelemetryAt,
    telemetryHealthy,
    telemetryError,
    liveState,
}: {
    connectedCount: number;
    lastStateSyncAt: string | null;
    lastTelemetryAt: string | null;
    telemetryHealthy: boolean;
    telemetryError: string | null;
    liveState: DisplayState;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile
                label="Connected displays"
                value={String(connectedCount).padStart(2, "0")}
                detail={telemetryHealthy ? "Status healthy" : "Status issue"}
                tone={telemetryHealthy ? "cyan" : "danger"}
            />
            <MetricTile label="State sync" value={formatDateTime(lastStateSyncAt)} detail="Latest board refresh" />
            <MetricTile label="Telemetry poll" value={formatDateTime(lastTelemetryAt)} detail="Latest status check" />
            <MetricTile
                label="Live layout"
                value={templateLabel(liveState.layoutTemplate)}
                detail={liveState.frozen ? "Frozen" : "Active"}
                tone={liveState.frozen ? "amber" : "green"}
            />

            {telemetryError ? (
                <div className="sm:col-span-2 rounded-[14px] border px-4 py-3" style={{ borderColor: PALETTE.red, background: PALETTE.redSoft }}>
                    <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.red }}>
                        Telemetry degraded
                    </div>
                    <div className="mt-2 text-sm" style={{ color: PALETTE.text }}>
                        {telemetryError}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function ControlRack({
    state,
    frozen,
    onUpdateState,
    onToggleFreeze,
    onSendStandby,
}: {
    state: DisplayState;
    frozen: boolean;
    onUpdateState: (updates: Partial<DisplayState>) => void;
    onToggleFreeze: () => void;
    onSendStandby: () => void;
}) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <ActionButton
                    variant={state.showDonorNames ? "primary" : "ghost"}
                    active={state.showDonorNames}
                    onClick={() => onUpdateState({ showDonorNames: !state.showDonorNames })}
                    className="w-full justify-center"
                >
                    {state.showDonorNames ? "Donor names visible" : "Donor names hidden"}
                </ActionButton>
                <ActionButton
                    variant={state.autoCycleEnabled ? "amber" : "ghost"}
                    active={state.autoCycleEnabled}
                    onClick={() => onUpdateState({ autoCycleEnabled: !state.autoCycleEnabled })}
                    className="w-full justify-center"
                >
                    {state.autoCycleEnabled ? "Auto-cycle enabled" : "Auto-cycle disabled"}
                </ActionButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(140px,0.55fr)]">
                <InputShell label="Cycle interval" hint="Seconds between rotating scenes.">
                    <TextInput
                        type="number"
                        min={5}
                        max={300}
                        inputMode="numeric"
                        value={state.autoCycleIntervalSec}
                        onChange={(event) => {
                            const raw = Number(event.target.value);
                            const interval = Number.isFinite(raw) ? clampNumber(raw, 5, 300) : 30;
                            onUpdateState({ autoCycleIntervalSec: interval });
                        }}
                    />
                </InputShell>
                <div className="rounded-[14px] border px-4 py-3" style={{ borderColor: PALETTE.line, background: PALETTE.panelAlt }}>
                    <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.muted }}>
                        Current interval
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[0.14em] tabular-nums" style={{ color: PALETTE.text }}>
                        {formatInterval(state.autoCycleIntervalSec)}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <ActionButton
                    variant={frozen ? "danger" : "secondary"}
                    active={frozen}
                    onClick={onToggleFreeze}
                    className="w-full justify-center"
                >
                    {frozen ? "Unfreeze display" : "Freeze display"}
                </ActionButton>
                <ActionButton variant="amber" onClick={onSendStandby} className="w-full justify-center">
                    Send to standby
                </ActionButton>
            </div>
        </div>
    );
}

function OverrideCard({
    title,
    eyebrow,
    hint,
    disabled,
    actionLabel,
    tone,
    children,
    onAction,
}: {
    title: string;
    eyebrow: string;
    hint: string;
    disabled: boolean;
    actionLabel: string;
    tone: ButtonVariant;
    children: ReactNode;
    onAction: () => void;
}) {
    return (
        <div
            className="rounded-[14px] border p-4"
            style={{
                borderColor: PALETTE.line,
                background: disabled ? PALETTE.wash : PALETTE.panelAlt,
                opacity: disabled ? 0.72 : 1,
            }}
        >
            <div className="text-[10px] uppercase tracking-[0.36em]" style={{ color: PALETTE.muted }}>
                {eyebrow}
            </div>
            <div className="mt-1 text-sm font-semibold tracking-[0.16em]" style={{ color: PALETTE.text }}>
                {title}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.24em]" style={{ color: PALETTE.muted }}>
                {hint}
            </div>
            <div className="mt-4 space-y-3">{children}</div>
            <ActionButton variant={tone} disabled={disabled} onClick={onAction} className="mt-4 w-full justify-center">
                {actionLabel}
            </ActionButton>
        </div>
    );
}

function OverrideRack({
    state,
    onPushOverride,
    onClearOverride,
}: {
    state: DisplayState;
    onPushOverride: (scene: "ANNOUNCEMENT" | "MILESTONE" | "TOTAL", payload: Record<string, unknown>) => void;
    onClearOverride: () => void;
}) {
    const [announcement, setAnnouncement] = useState("");
    const [milestone, setMilestone] = useState("");
    const locked = Boolean(state.activeOverride);

    return (
        <div className="space-y-3">
            {state.activeOverride ? (
                <div className="rounded-[14px] border px-4 py-3" style={{ borderColor: PALETTE.amber, background: PALETTE.amberSoft }}>
                    <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.amber }}>
                        Active override
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm tracking-[0.14em]" style={{ color: PALETTE.text }}>
                            {state.activeOverride}
                        </div>
                        <ActionButton variant="danger" onClick={onClearOverride}>
                            Clear override
                        </ActionButton>
                    </div>
                </div>
            ) : (
                <div className="rounded-[14px] border px-4 py-3" style={{ borderColor: PALETTE.line, background: PALETTE.wash }}>
                    <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: PALETTE.muted }}>
                        Override state
                    </div>
                    <div className="mt-2 text-sm" style={{ color: PALETTE.muted }}>
                        No live cue is active. Broadcast overrides can be triggered below.
                    </div>
                </div>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
                <OverrideCard
                    title="Milestone"
                    eyebrow="Celebration cue"
                    hint="Push a full-screen moment for a milestone announcement."
                    disabled={locked}
                    actionLabel="Trigger milestone"
                    tone="amber"
                    onAction={() => {
                        const trimmed = milestone.trim();
                        if (!trimmed) {
                            return;
                        }
                        onPushOverride("MILESTONE", { message: trimmed });
                        setMilestone("");
                    }}
                >
                    <TextArea
                        rows={4}
                        placeholder="Celebration message"
                        value={milestone}
                        disabled={locked}
                        onChange={(event) => setMilestone(event.target.value)}
                    />
                </OverrideCard>

                <OverrideCard
                    title="Announcement"
                    eyebrow="Program cue"
                    hint="Broadcast a message across the projector display."
                    disabled={locked}
                    actionLabel="Trigger announcement"
                    tone="primary"
                    onAction={() => {
                        const trimmed = announcement.trim();
                        if (!trimmed) {
                            return;
                        }
                        onPushOverride("ANNOUNCEMENT", { message: trimmed });
                        setAnnouncement("");
                    }}
                >
                    <TextArea
                        rows={4}
                        placeholder="Announcement message"
                        value={announcement}
                        disabled={locked}
                        onChange={(event) => setAnnouncement(event.target.value)}
                    />
                </OverrideCard>
            </div>
        </div>
    );
}

export function AdminConsole({
    state,
    liveState,
    connectedCount,
    lastStateSyncAt,
    lastTelemetryAt,
    telemetryHealthy,
    telemetryError,
    error,
    saving,
    hasPendingChanges,
    onRefresh,
    onTemplateChange,
    onSlotsChange,
    onUpdateState,
    onApplyChanges,
    onResetChanges,
    onPushOverride,
    onClearOverride,
    onToggleFreeze,
    onSendStandby,
}: AdminConsoleProps) {
    const draftHasBar = templateHasBar(state.layoutTemplate);
    const liveHasBar = templateHasBar(liveState.layoutTemplate);
    const overrideTone: ButtonVariant = liveState.activeOverride ? "danger" : "ghost";

    return (
        <div
            className="min-h-screen text-[#17324A]"
            style={{
                background: PALETTE.bg,
                colorScheme: "light",
                backgroundImage:
                    "radial-gradient(circle at 8% 0%, rgba(11,78,162,0.08), transparent 28%), radial-gradient(circle at 92% 0%, rgba(241,201,58,0.16), transparent 24%), linear-gradient(rgba(11,78,162,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(11,78,162,0.07) 1px, transparent 1px)",
                backgroundSize: "auto, auto, 56px 56px, 56px 56px",
            }}
        >
            {error ? (
                <div className="mx-auto max-w-[1720px] px-4 pt-4 md:px-6">
                    <div className="rounded-[14px] border px-4 py-3 text-sm" style={{ borderColor: PALETTE.red, background: PALETTE.redSoft, color: PALETTE.text }}>
                        {error}
                    </div>
                </div>
            ) : null}

            <main className="mx-auto max-w-[1720px] px-4 pb-40 pt-4 md:px-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(380px,0.84fr)]">
                    <div className="space-y-4">
                        <Panel title="Program Surface" eyebrow="Layout / slot map">
                            <div className="space-y-5">
                                <TemplateMatrix
                                    template={state.layoutTemplate}
                                    onSelect={(template) => {
                                        onTemplateChange(template);
                                    }}
                                />
                                <div className="border-t pt-5" style={{ borderColor: PALETTE.line }}>
                                    <Label
                                        title="Slot programming"
                                        hint="Unsupported hourly scenes are removed from the control surface."
                                    />
                                    <SlotProgrammer slots={state.slots} onChange={onSlotsChange} />
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Progress Rail" eyebrow="Bar / time window">
                            <BarConfigPanel state={state} onUpdateState={onUpdateState} />
                        </Panel>
                    </div>

                    <div className="space-y-4">
                        <Panel title="Operational Telemetry" eyebrow="API / display status">
                            <TelemetryPanel
                                connectedCount={connectedCount}
                                lastStateSyncAt={lastStateSyncAt}
                                lastTelemetryAt={lastTelemetryAt}
                                telemetryHealthy={telemetryHealthy}
                                telemetryError={telemetryError}
                                liveState={liveState}
                            />
                        </Panel>

                        <Panel title="Command Rack" eyebrow="Live controls">
                            <ControlRack
                                state={state}
                                frozen={liveState.frozen}
                                onUpdateState={onUpdateState}
                                onToggleFreeze={onToggleFreeze}
                                onSendStandby={onSendStandby}
                            />
                        </Panel>

                        <Panel title="Override Queue" eyebrow="Cue / takeover" className={liveState.activeOverride ? "ring-1 ring-[#E7B919]/20" : ""}>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <ActionButton variant={overrideTone} active={Boolean(liveState.activeOverride)} onClick={onRefresh}>
                                        Refresh
                                    </ActionButton>
                                    <ActionButton variant="ghost" disabled={!liveState.activeOverride} onClick={onClearOverride}>
                                        Clear live cue
                                    </ActionButton>
                                    <span className="text-[11px] uppercase tracking-[0.26em]" style={{ color: PALETTE.muted }}>
                                        {liveState.activeOverride ? "Override holds until cleared" : "Ready for a manual cue"}
                                    </span>
                                </div>

                                <OverrideRack state={liveState} onPushOverride={onPushOverride} onClearOverride={onClearOverride} />
                            </div>
                        </Panel>
                    </div>
                </div>
            </main>

            <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:px-6">
                <div
                    className="mx-auto max-w-[1720px] rounded-[20px] border px-4 py-4 shadow-[0_10px_22px_rgba(11,78,162,0.08)]"
                    style={{
                        borderColor: PALETTE.line,
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,252,244,0.98)), linear-gradient(180deg, rgba(247,251,255,0.96), rgba(255,253,247,0.98))",
                    }}
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: hasPendingChanges ? PALETTE.cyan : PALETTE.muted }}>
                                {hasPendingChanges ? "Ready to send" : "No pending changes"}
                            </div>
                            <div className="mt-1 text-sm font-semibold tracking-[0.06em]" style={{ color: PALETTE.text }}>
                                {hasPendingChanges
                                    ? `${templateLabel(state.layoutTemplate)}${draftHasBar ? " with bar" : ""} is queued locally.`
                                    : `${templateLabel(liveState.layoutTemplate)}${liveHasBar ? " with bar" : ""} is live now.`}
                            </div>
                            <div className="mt-1 text-[11px]" style={{ color: PALETTE.muted }}>
                                {saving
                                    ? "Sending or updating live controls..."
                                    : lastStateSyncAt
                                        ? `Last sync ${formatDateTime(lastStateSyncAt)}`
                                        : "Waiting for sync"}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <ActionButton variant="ghost" onClick={onRefresh}>
                                Refresh
                            </ActionButton>
                            <ActionButton variant="secondary" disabled={!hasPendingChanges || saving} onClick={onResetChanges}>
                                Reset draft
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                active={hasPendingChanges}
                                disabled={!hasPendingChanges || saving}
                                onClick={onApplyChanges}
                            >
                                {saving ? "Sending..." : "Send scene"}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pointer-events-none fixed inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#F5F8FF] to-transparent" />
        </div>
    );
}
