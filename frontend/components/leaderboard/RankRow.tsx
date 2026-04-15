"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type RankRowProps = {
    rank: number;
    name: string;
    amount: number;
    direction: "up" | "down" | "same" | "new" | "dropped";
    magnitude: number;
};

function formatDollar(value: number): string {
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RankRow({ rank, name, amount, direction, magnitude }: RankRowProps) {
    const [flash, setFlash] = useState(false);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (direction === "up" || direction === "down" || direction === "new") {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [direction, magnitude]);

    const flashColor =
        direction === "up" ? "rgba(47,143,98,0.12)"
        : direction === "down" ? "rgba(180,120,34,0.12)"
        : direction === "new" ? "rgba(29,122,140,0.12)"
        : "transparent";

    const indicatorColor =
        direction === "up" ? "#0b8f55"
        : direction === "down" ? "#f1a91d"
        : direction === "new" ? "#0b4ea2"
        : "#7e90b5";
    const indicatorText =
        direction === "up" ? "▲"
        : direction === "down" ? "▼"
        : direction === "new" ? "●"
        : "";

    return (
        <motion.div
            layout="position"
            className="grid grid-cols-[minmax(3.8rem,4.6rem)_minmax(0,1fr)_minmax(7.5rem,10rem)_minmax(1.5rem,2rem)] items-center gap-3 rounded-[22px] border-2 border-[#d7e5ff] bg-[#fffef8] px-3 py-3 md:px-4"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{
                opacity: 1,
                y: 0,
                backgroundColor: flash ? flashColor : "#fffdf7",
            }}
            transition={{
                duration: reduceMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            <div className="flex items-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#f1c93a] bg-[#fff7d6] font-mono text-lg font-semibold tabular-nums text-[#0b4ea2]">
                    {rank}
                </span>
            </div>

            <span className="min-w-0 truncate text-base font-semibold text-[#0b3e86] md:text-lg">
                {name}
            </span>

            <span className="justify-self-end font-mono text-xl tabular-nums text-[#0b3e86] md:text-2xl">
                {formatDollar(amount)}
            </span>

            <span className="justify-self-end text-right text-base font-semibold" style={{ color: indicatorColor }}>
                {indicatorText}
            </span>
        </motion.div>
    );
}
