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
} from "../../hooks/useDisplayRuntime";

const EVENT_LOGO = process.env.NEXT_PUBLIC_EVENT_LOGO_PNG;

function isBarTemplate(template: string): boolean {
    return template.endsWith("_BAR");
}

function gridTemplateForLayout(template: string): string {
    const normalized = template.replace("_BAR", "");

    if (normalized === "FULL_SCREEN") {
        return "minmax(0, 1fr)";
    }

    if (normalized === "MAIN_SIDEBAR") {
        return "minmax(0, 1.55fr) minmax(0, 0.92fr)";
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

function formatClock(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function SceneRenderer({
    scene,
    liveData,
    showDonorNames,
    payload,
    frozen,
    allowManualTotal,
}: {
    scene: DisplaySceneId;
    liveData: DisplayLiveData;
    showDonorNames: boolean;
    payload?: Record<string, any>;
    frozen: boolean;
    allowManualTotal: boolean;
}) {
    switch (scene) {
        case "STANDBY":
            return <StandbyScene />;
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
            return <TeamLeaderboardScene teams={liveData.teams} frozen={frozen} showHeader />;
        case "PARTICIPANT_LEADERBOARD":
            return <ParticipantLeaderboardScene participants={liveData.participants} frozen={frozen} showHeader />;
        case "ANNOUNCEMENT":
            return <AnnouncementScene message={payload?.message || ""} fontSize={payload?.fontSize} frozen={frozen} />;
        case "MILESTONE":
            return <MilestoneScene message={payload?.message || ""} frozen={frozen} />;
        case "TOTAL":
            return allowManualTotal ? <TotalScene amount={Number(payload?.amount ?? 0)} frozen={frozen} /> : <StandbyScene />;
        default:
            return <StandbyScene />;
    }
}

function SceneSurface({
    slot,
    index,
    liveData,
    showDonorNames,
    frozen,
}: {
    slot: DisplaySlot;
    index: number;
    liveData: DisplayLiveData;
    showDonorNames: boolean;
    frozen: boolean;
}) {
    const scene = sceneForSlot(slot, index);

    return (
        <section className="relative h-full min-h-0 overflow-hidden rounded-[28px] border-4 border-[#f1c93a] bg-[#eff5ff] shadow-[0_14px_34px_rgba(4,43,97,0.26)]">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={sceneKeyForSlot(slot, index)}
                    className="absolute inset-0"
                    initial={frozen ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={frozen ? { opacity: 1 } : { opacity: 0, y: -10 }}
                    transition={{ duration: frozen ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <SceneRenderer
                        scene={scene}
                        liveData={liveData}
                        showDonorNames={showDonorNames}
                        frozen={frozen}
                        allowManualTotal={false}
                    />
                </motion.div>
            </AnimatePresence>
        </section>
    );
}

function UtilityRail({ frame }: { frame: DisplayFrameState }) {
    const hourly = frame.liveData.hourly;
    const barType = frame.layout.progressBarType;
    const goal = typeof frame.layout.progressBarGoal === "number" ? frame.layout.progressBarGoal : null;
    const currentValue =
        barType === "DONATION_COUNT"
            ? Number(hourly?.count ?? 0)
            : barType === "PERIOD_TOTAL"
                ? Number(hourly?.total ?? 0)
                : 0;

    const hasGoal = goal !== null && goal > 0;
    const fillPercent = hasGoal ? Math.max(0, Math.min(100, (currentValue / goal) * 100)) : 0;
    const currentLabel =
        barType === "DONATION_COUNT"
            ? formatInteger(currentValue)
            : barType === "PERIOD_TOTAL"
                ? formatCurrency(currentValue)
                : "";
    const goalLabel =
        goal === null
            ? ""
            : barType === "DONATION_COUNT"
                ? formatInteger(goal)
                : formatCurrency(goal);
    const startLabel = formatClock(frame.layout.progressBarStartTime);
    const endLabel = formatClock(frame.layout.progressBarEndTime);

    return (
        <div className="rounded-[24px] border-4 border-[#f1c93a] bg-[#f6fbff] px-4 py-3 shadow-[0_12px_28px_rgba(4,43,97,0.18)]">
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
                <div className="min-w-[5.5rem] text-left font-mono text-lg font-semibold text-[#0b4ea2]">
                    {currentLabel}
                </div>
                <div className="space-y-2">
                    <div className="h-5 overflow-hidden rounded-full bg-[#d6e6ff] ring-2 ring-[#0b4ea2]/12">
                        <motion.div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#164b9a_0%,#2b72d6_54%,#f1c93a_100%)]"
                            initial={false}
                            animate={{ width: `${fillPercent}%` }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                    {(startLabel || endLabel) && (
                        <div className="flex items-center justify-between gap-3 font-mono text-sm font-semibold text-[#144b90]">
                            <span>{startLabel}</span>
                            <span>{endLabel}</span>
                        </div>
                    )}
                </div>
                <div className="min-w-[5.5rem] text-right font-mono text-lg font-semibold text-[#0b4ea2]">
                    {goalLabel}
                </div>
            </div>
        </div>
    );
}

export default function EventBoard({ frame, status }: DisplayRuntimeState) {
    const reduceMotion = useReducedMotion();
    const hasBar = isBarTemplate(frame.layout.layoutTemplate);
    const hasOverride = Boolean(frame.override);
    const logo = EVENT_LOGO;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#0b4ea2]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(241,201,58,0.18),_transparent_30%),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:auto,auto,38px_38px,38px_38px]" />
            {logo ? (
                <img
                    src={logo}
                    alt=""
                    className="pointer-events-none absolute right-6 top-6 h-20 w-20 object-contain opacity-20"
                />
            ) : null}

            <div className="relative h-full p-3 md:p-4">
                <div className={`grid h-full min-h-0 gap-3 ${hasBar ? "grid-rows-[minmax(0,1fr)_auto]" : "grid-rows-1"}`}>
                    <div className="min-h-0">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={
                                    hasOverride
                                        ? `override:${frame.override?.scene}:${frame.override?.payload?.message ?? frame.override?.payload?.amount ?? ""}`
                                        : `layout:${frame.layout.layoutTemplate}:${frame.layout.slots
                                              .map((slot) => (slot.type === "pinned" ? slot.scene : slot.scenes.join("-")))
                                              .join("|")}`
                                }
                                className="h-full"
                                initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {hasOverride && frame.override ? (
                                    <div className="h-full overflow-hidden rounded-[28px] border-4 border-[#f1c93a] bg-[#eff5ff] shadow-[0_14px_34px_rgba(4,43,97,0.26)]">
                                        <SceneRenderer
                                            scene={frame.override.scene}
                                            liveData={frame.liveData}
                                            showDonorNames={frame.layout.showDonorNames}
                                            payload={frame.override.payload}
                                            frozen={status.frozen}
                                            allowManualTotal
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={`grid h-full min-h-0 gap-3 ${frame.layout.slots.length === 1 ? "grid-cols-1" : ""}`}
                                        style={{ gridTemplateColumns: gridTemplateForLayout(frame.layout.layoutTemplate) }}
                                    >
                                        {frame.layout.slots.map((slot, index) => (
                                            <SceneSurface
                                                key={sceneKeyForSlot(slot, index)}
                                                slot={slot}
                                                index={frame.rotatingIndices[index] ?? 0}
                                                liveData={frame.liveData}
                                                showDonorNames={frame.layout.showDonorNames}
                                                frozen={status.frozen}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {hasBar ? <UtilityRail frame={frame} /> : null}
                </div>
            </div>
        </div>
    );
}
