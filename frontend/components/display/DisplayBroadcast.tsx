"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AnnouncementScene from "../scenes/AnnouncementScene";
import DonationsScene from "../scenes/DonationsScene";
import MilestoneScene from "../celebrations/MilestoneScene";
import ParticipantLeaderboardScene from "../scenes/ParticipantLeaderboardScene";
import StandbyScene from "../scenes/StandbyScene";
import TeamLeaderboardScene from "../scenes/TeamLeaderboardScene";
import TotalScene from "../scenes/TotalScene";
import type {
    DisplayFrameState,
    DisplayLiveData,
    DisplayRuntimeState,
    DisplaySceneId,
    DisplaySlot,
    DisplayStatusState,
} from "../../hooks/useDisplayRuntime";

const EVENT_LOGO = process.env.NEXT_PUBLIC_EVENT_LOGO_PNG;

function formatCurrency(value: number): string {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatInteger(value: number): string {
    return value.toLocaleString("en-US");
}

function formatSceneLabel(scene: DisplaySceneId): string {
    return scene
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isBarTemplate(template: string): boolean {
    return template.endsWith("_BAR");
}

function gridTemplateForLayout(template: string): string {
    const normalized = template.replace("_BAR", "");

    if (normalized === "FULL_SCREEN") {
        return "minmax(0, 1fr)";
    }

    if (normalized === "MAIN_SIDEBAR") {
        return "minmax(0, 1.45fr) minmax(340px, 0.95fr)";
    }

    return "repeat(3, minmax(0, 1fr))";
}

function sceneKeyForSlot(slot: DisplaySlot, index: number): string {
    if (slot.type === "pinned") {
        return `${index}:${slot.scene}`;
    }

    const sceneIndex = slot.scenes.length > 0 ? index % slot.scenes.length : 0;
    return `${index}:${slot.scenes[sceneIndex] ?? "STANDBY"}:${sceneIndex}`;
}

function sceneForSlot(slot: DisplaySlot, index: number): DisplaySceneId {
    if (slot.type === "pinned") {
        return slot.scene;
    }

    if (slot.scenes.length === 0) {
        return "STANDBY";
    }

    return slot.scenes[index % slot.scenes.length];
}

function SceneRenderer({
    scene,
    liveData,
    showDonorNames,
    payload,
    frozen,
    allowManualTotal,
    awaitingDirectorSync,
}: {
    scene: DisplaySceneId;
    liveData: DisplayLiveData;
    showDonorNames: boolean;
    payload?: Record<string, any>;
    frozen: boolean;
    allowManualTotal: boolean;
    awaitingDirectorSync: boolean;
}) {
    switch (scene) {
        case "STANDBY":
            return (
                <StandbyScene
                    headline={awaitingDirectorSync ? "Awaiting director sync" : "Dance Marathon"}
                    subtitle={awaitingDirectorSync ? "Waiting for the first programmed scene to arrive." : "Broadcast feed ready"}
                    statusLabel={awaitingDirectorSync ? "BOOTING" : frozen ? "HOLDING FRAME" : "LIVE STAGE"}
                />
            );
        case "DONATIONS":
            return (
                <DonationsScene
                    donations={liveData.donations}
                    donationsReady={liveData.donationsReady}
                    showDonorNames={showDonorNames}
                    participants={liveData.participants}
                    teams={liveData.teams}
                    frozen={frozen}
                />
            );
        case "TEAM_LEADERBOARD":
            return <TeamLeaderboardScene teams={liveData.teams} frozen={frozen} />;
        case "PARTICIPANT_LEADERBOARD":
            return <ParticipantLeaderboardScene participants={liveData.participants} frozen={frozen} />;
        case "ANNOUNCEMENT":
            return <AnnouncementScene message={payload?.message || ""} fontSize={payload?.fontSize} frozen={frozen} />;
        case "MILESTONE":
            return <MilestoneScene message={payload?.message || ""} frozen={frozen} />;
        case "TOTAL":
            return allowManualTotal ? <TotalScene amount={Number(payload?.amount ?? 0)} frozen={frozen} /> : (
                <StandbyScene
                    headline="Manual total only"
                    subtitle="This scene is reserved for operator overrides."
                    statusLabel="DISPLAY HOLD"
                />
            );
        default:
            return (
                <StandbyScene
                    headline="Dance Marathon"
                    subtitle="Waiting for director sync"
                    statusLabel="STANDBY"
                />
            );
    }
}

function formatClock(value: string | null | undefined, fallback: string): string {
    if (!value) {
        return fallback;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function SlotSurface({
    slot,
    index,
    liveData,
    showDonorNames,
    frozen,
    awaitingDirectorSync,
}: {
    slot: DisplaySlot;
    index: number;
    liveData: DisplayLiveData;
    showDonorNames: boolean;
    frozen: boolean;
    awaitingDirectorSync: boolean;
}) {
    const scene = sceneForSlot(slot, index);
    const title = formatSceneLabel(scene);
    const sceneKey = sceneKeyForSlot(slot, index);
    const showHeader = slot.type === "rotating" || scene !== "STANDBY";

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#d9c99a] bg-[#fffdf7] shadow-[0_16px_32px_rgba(120,93,44,0.08)]">
            {showHeader && (
                <div className="flex items-center justify-between border-b border-[#eadcbb] bg-[#f8eed8] px-5 py-3 text-sm text-[#6f603e]">
                    <span className="rounded-full bg-[#fff8e8] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#a37124]">
                        {slot.type === "rotating" ? "Rotating slot" : "Pinned slot"}
                    </span>
                    <span className="truncate text-base font-semibold text-[#17324a]">{title}</span>
                </div>
            )}
            <div className={`relative flex-1 min-h-0 overflow-hidden bg-[#fff7e6] ${showHeader ? "pt-0" : ""}`}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={sceneKey}
                        className="absolute inset-0"
                        initial={frozen ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985 }}
                        animate={frozen ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={frozen ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.985 }}
                        transition={{ duration: frozen ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <SceneRenderer
                            scene={scene}
                            liveData={liveData}
                            showDonorNames={showDonorNames}
                            frozen={frozen}
                            allowManualTotal={false}
                            awaitingDirectorSync={awaitingDirectorSync}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}

function OverlayStatus({ status }: { status: DisplayStatusState }) {
    const tone =
        status.connectionState === "live"
            ? "bg-[#2F8F62]"
            : status.connectionState === "reconnecting"
                ? "bg-[#B47822]"
                : "bg-[#8A7552]";

    const label =
        status.connectionState === "live"
            ? "Live"
            : status.connectionState === "reconnecting"
                ? "Reconnecting"
                : status.connectionState === "booting"
                    ? "Booting"
                    : "Offline";

    return (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-[#d7c89c] bg-[#fffdf7]/95 px-4 py-2 text-sm text-[#17324a] shadow-[0_14px_28px_rgba(120,93,44,0.1)] backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${tone}`} />
            <span className="font-semibold">{label}</span>
            {status.frozen && (
                <>
                    <span className="h-1 w-1 rounded-full bg-[#8A7552]" />
                    <span className="text-[#B47822]">Paused</span>
                </>
            )}
        </div>
    );
}

function UtilityRail({
    frame,
}: {
    frame: DisplayFrameState;
}) {
    const hourly = frame.liveData.hourly;
    const barType = frame.layout.progressBarType;
    const goal = frame.layout.progressBarGoal;
    const value =
        barType === "DONATION_COUNT"
            ? Number(hourly?.count ?? 0)
            : barType === "PERIOD_TOTAL"
                ? Number(hourly?.total ?? 0)
                : null;
    const progress = goal && goal > 0 && value !== null ? Math.max(0, Math.min(1, value / goal)) : null;
    const formatValue = (input: number | null) => {
        if (input === null) return "--";
        return barType === "DONATION_COUNT" ? formatInteger(input) : formatCurrency(input);
    };

    return (
        <div className="border-t border-[#eadcbb] bg-[#fcf3de] px-5 py-4">
            <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,2fr)_1fr] md:items-center">
                <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#A37124]">Progress rail</p>
                    <p className="text-lg font-semibold text-[#17324A]">
                        {barType ? (barType === "PERIOD_TOTAL" ? "Hourly total" : "Donation count") : "Awaiting progress config"}
                    </p>
                </div>
                <div className="space-y-2">
                    <div className="h-4 overflow-hidden rounded-full border border-[#D7C89C] bg-[#FFFDF7]">
                        <motion.div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#F0C77A_0%,#D69235_38%,#2C90A6_100%)]"
                            initial={false}
                            animate={{ width: `${progress !== null ? progress * 100 : 0}%` }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-[#6F603E]">
                        <span>{formatClock(frame.layout.progressBarStartTime, "Start not set")}</span>
                        <span>{formatClock(frame.layout.progressBarEndTime, "End not set")}</span>
                    </div>
                </div>
                <div className="flex items-end justify-between gap-4 md:flex-col md:items-end">
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A7552]">Current</p>
                        <p className="font-mono text-xl tabular-nums text-[#17324A]">
                            {formatValue(value)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A7552]">Goal</p>
                        <p className="font-mono text-xl tabular-nums text-[#B47822]">
                            {formatValue(goal)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DisplayBroadcast({ frame, status }: DisplayRuntimeState) {
    const reduceMotion = useReducedMotion();
    const isBar = isBarTemplate(frame.layout.layoutTemplate);
    const slotCount = frame.layout.slots.length;
    const allowOverride = Boolean(frame.override);
    const sceneTitle = allowOverride ? frame.override?.scene ?? "STANDBY" : frame.layout.layoutTemplate.replace("_BAR", "");
    const sceneBadge = sceneTitle
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
    const logo = EVENT_LOGO;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#F4ECD8] text-[#17324A]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.55),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(240,199,122,0.22),_transparent_26%),linear-gradient(rgba(122,94,48,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(122,94,48,0.08)_1px,transparent_1px)] [background-size:auto,auto,58px_58px,58px_58px]" />

            <div className="relative flex h-full flex-col">
                <header className="flex items-center justify-between border-b border-[#D9C99A] bg-[#FFF9EE]/95 px-5 py-4 shadow-[0_16px_32px_rgba(120,93,44,0.08)] backdrop-blur">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#D9C99A] bg-[#FFFDF7]">
                            {logo ? (
                                <img src={logo} alt="Event logo" className="h-8 w-8 object-contain" />
                            ) : (
                                <span className="text-sm font-semibold text-[#1D7A8C]">DM</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A37124]">
                                Live display
                            </p>
                            <div className="flex min-w-0 items-center gap-3">
                                <h1 className="truncate text-lg font-semibold text-[#17324A] md:text-2xl">
                                    Donation board
                                </h1>
                                <span className="rounded-full bg-[#F8ECD0] px-3 py-1 text-sm text-[#6F603E]">
                                    {sceneBadge}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full border border-[#D9C99A] bg-[#FFFDF7] px-3 py-1 text-[11px] text-[#6F603E]">
                            {frame.layout.layoutTemplate.replace("_BAR", "")}
                        </span>
                        <span className="rounded-full border border-[#D9C99A] bg-[#FFFDF7] px-3 py-1 text-[11px] text-[#6F603E]">
                            {slotCount} view{slotCount === 1 ? "" : "s"}
                        </span>
                        <span
                            className={`rounded-full border px-3 py-1 text-[11px] ${
                                status.frozen
                                    ? "border-[#B47822] bg-[#FFF0CF] text-[#B47822]"
                                    : frame.layout.autoCycleEnabled && !frame.override
                                        ? "border-[#1D7A8C] bg-[#E6F4F7] text-[#1D7A8C]"
                                        : "border-[#D9C99A] bg-[#FFFDF7] text-[#6F603E]"
                            }`}
                        >
                            {status.frozen ? "Paused" : frame.layout.autoCycleEnabled && !frame.override ? "Auto-rotate" : "Manual"}
                        </span>
                    </div>
                </header>

                <main className="relative flex-1 p-5">
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-[#D9C99A] bg-[#FFF9EE]/96 shadow-[0_18px_36px_rgba(120,93,44,0.08)]">
                        <div className="relative flex-1 min-h-0 overflow-hidden">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={
                                        allowOverride
                                            ? `override:${frame.override?.scene}:${frame.override?.payload?.message ?? frame.override?.payload?.amount ?? ""}`
                                            : `layout:${frame.layout.layoutTemplate}:${frame.layout.slots
                                                  .map((slot) => (slot.type === "pinned" ? slot.scene : slot.scenes.join("-")))
                                                  .join("|")}`
                                    }
                                    className="absolute inset-0"
                                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                    transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {allowOverride && frame.override ? (
                                        <SceneRenderer
                                            scene={frame.override.scene}
                                            liveData={frame.liveData}
                                            showDonorNames={frame.layout.showDonorNames}
                                            payload={frame.override.payload}
                                            frozen={status.frozen}
                                            allowManualTotal
                                            awaitingDirectorSync={status.awaitingDirectorSync}
                                        />
                                    ) : (
                                        <div className={`grid h-full min-h-0 gap-4 bg-transparent p-4 ${slotCount === 1 ? "grid-cols-1" : ""}`}
                                             style={{ gridTemplateColumns: gridTemplateForLayout(frame.layout.layoutTemplate) }}>
                                            {frame.layout.slots.map((slot, index) => (
                                                <SlotSurface
                                                    key={sceneKeyForSlot(slot, index)}
                                                    slot={slot}
                                                    index={frame.rotatingIndices[index] ?? 0}
                                                    liveData={frame.liveData}
                                                    showDonorNames={frame.layout.showDonorNames}
                                                    frozen={status.frozen}
                                                    awaitingDirectorSync={status.awaitingDirectorSync}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {isBar && <UtilityRail frame={frame} />}
                    </div>
                </main>
            </div>

            {frame.liveData.hourly && (
                <div className="pointer-events-none fixed left-5 top-5 z-40 hidden rounded-full border border-[#D9C99A] bg-[#FFFDF7]/95 px-4 py-2 text-[11px] text-[#6F603E] shadow-[0_12px_26px_rgba(120,93,44,0.08)] lg:block">
                    {frame.layout.progressBarType === "DONATION_COUNT" ? "Hourly Count" : "Hourly Total"}
                </div>
            )}

            <AnimatePresence>
                {status.connectionState !== "live" && (
                    <motion.div
                        key={status.connectionState}
                        className="pointer-events-none fixed bottom-5 left-5 z-50 rounded-full border border-[#D7C89C] bg-[#FFFDF7]/95 px-4 py-2 text-sm text-[#68583A] shadow-[0_12px_26px_rgba(120,93,44,0.08)] backdrop-blur"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {status.connectionState === "booting" && "Connecting to the director feed"}
                        {status.connectionState === "reconnecting" && "Trying to reconnect"}
                        {status.connectionState === "offline" && "Display feed is offline"}
                    </motion.div>
                )}
            </AnimatePresence>

            <OverlayStatus status={status} />
        </div>
    );
}

