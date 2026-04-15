"use client";

import { AnimatePresence, motion } from "framer-motion";
import RankRow from "../leaderboard/RankRow";

type TeamData = {
    rankings: { id: number; name: string; amount: number }[];
    diff: { id: number; name: string; amount: number; newRank: number | null; direction: "up" | "down" | "same" | "new" | "dropped"; magnitude: number }[];
};

export default function TeamLeaderboardScene({
    teams,
    frozen = false,
    showHeader = false,
}: {
    teams: TeamData | null;
    frozen?: boolean;
    showHeader?: boolean;
}) {
    if (!teams || !teams.diff || teams.diff.length === 0) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#edf5ff]">
                <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-[#0b4ea2] animate-pulse" />
                    <span className="h-3 w-3 rounded-full bg-[#f1c93a] animate-pulse [animation-delay:150ms]" />
                    <span className="h-3 w-3 rounded-full bg-[#0b4ea2] animate-pulse [animation-delay:300ms]" />
                </div>
            </div>
        );
    }

    const visible = teams.diff
        .filter(d => d.direction !== "dropped" && d.newRank !== null)
        .sort((a, b) => a.newRank! - b.newRank!)
        .slice(0, 10);

    return (
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#edf5ff] p-4">
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[26px] border-4 border-[#f1c93a] bg-[#f7fbff] p-3 shadow-[0_18px_36px_rgba(11,78,162,0.14)]">
                {showHeader ? (
                    <div className="flex flex-none items-center justify-center pb-3">
                        <div className="rounded-full border border-[#d7e5ff] bg-[#fff7d6] px-4 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0b4ea2]">
                            Team Leaderboard
                        </div>
                    </div>
                ) : null}
                <div className="min-h-0 flex-1 overflow-hidden">
                    <AnimatePresence initial={false}>
                        <motion.div
                            className="grid gap-2"
                            initial={false}
                            animate={{ opacity: 1 }}
                            transition={{ duration: frozen ? 0 : 0.25 }}
                        >
                            {visible.map((entry) => (
                                <RankRow
                                    key={entry.id}
                                    rank={(entry.newRank ?? 0) + 1}
                                    name={entry.name}
                                    amount={entry.amount}
                                    direction={entry.direction}
                                    magnitude={entry.magnitude}
                                />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
