"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const CONFETTI_COLORS = ["#1D7A8C", "#F0C77A", "#D95F4B", "#FFFDF7", "#0B4EA2"];
const CONFETTI_COUNT = 54;

type ConfettiPiece = {
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
    rotation: number;
    drift: number;
};

function generateConfetti(): ConfettiPiece[] {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 36,
        delay: Math.random() * 1.5,
        duration: 3.2 + Math.random() * 2.8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 5 + Math.random() * 10,
        rotation: Math.random() * 360,
        drift: -18 + Math.random() * 36,
    }));
}

export default function MilestoneScene({
    message,
    frozen = false,
}: {
    message: string;
    frozen?: boolean;
}) {
    const [visible, setVisible] = useState(false);
    const reduceMotion = useReducedMotion();
    const confetti = useMemo(() => generateConfetti(), [message]);
    const burstLines = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
    const burstRings = useMemo(() => Array.from({ length: 3 }, (_, i) => i), []);
    const sparkles = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                id: i,
                x: 10 + Math.random() * 80,
                y: 14 + Math.random() * 56,
                size: 10 + Math.random() * 18,
                delay: Math.random() * 0.55,
            })),
        [message],
    );

    useEffect(() => {
        setVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setVisible(true);
            });
        });
    }, [message]);

    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#edf5ff]">
            <style>{`\n                @keyframes confetti-fall {\n                    0% { transform: translate3d(0,-28px,0) rotate(0deg) scale(0.92); opacity: 0; }\n                    10% { opacity: 1; }\n                    100% { transform: translate3d(var(--confetti-drift),110vh,0) rotate(760deg) scale(1.02); opacity: 0; }\n                }\n                @keyframes sparkle-pulse {\n                    0%, 100% { transform: scale(0.55); opacity: 0.24; }\n                    50% { transform: scale(1.1); opacity: 1; }\n                }\n            `}</style>

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.76),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(241,201,58,0.24),_transparent_34%),radial-gradient(circle_at_center,_rgba(11,78,162,0.08),_transparent_42%)]" />
            <div className="pointer-events-none absolute inset-x-[16%] top-[7%] h-16 rounded-full bg-[#f1c93a]/18 blur-3xl md:h-24" />
            <div className="pointer-events-none absolute inset-x-[22%] bottom-[10%] h-20 rounded-full bg-[#0b4ea2]/12 blur-3xl md:h-28" />
            <div className="pointer-events-none absolute left-0 right-0 top-8 flex justify-center gap-3 opacity-80">
                {["#D95F4B", "#F0C77A", "#1D7A8C", "#D95F4B", "#F0C77A", "#1D7A8C"].map((color, index) => (
                    <span
                        key={`${color}-${index}`}
                        className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[28px] border-l-transparent border-r-transparent"
                        style={{ borderTopColor: color }}
                    />
                ))}
            </div>

            {burstRings.map((ring) => (
                <motion.div
                    key={`ring-${ring}`}
                    className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-4 border-[#f1c93a]/60"
                    initial={{ opacity: 0, scale: 0.25, x: "-50%", y: "-50%" }}
                    animate={{ opacity: frozen ? 0.22 : 0, scale: frozen ? 1.1 + ring * 0.14 : 1.5 + ring * 0.26, x: "-50%", y: "-50%" }}
                    transition={{
                        duration: reduceMotion ? 0 : 1.6,
                        delay: ring * 0.11,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                        width: `${32 + ring * 16}vw`,
                        height: `${32 + ring * 16}vw`,
                    }}
                />
            ))}

            {burstLines.map((line) => (
                <motion.div
                    key={line}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] origin-center bg-gradient-to-r from-transparent via-[#F1C93A] to-transparent"
                    initial={{ opacity: 0, scaleX: 0.2, rotate: line * 22.5 }}
                    animate={{ opacity: frozen ? 0.35 : 0.85, scaleX: 1.25, rotate: line * 15 }}
                    transition={{ duration: reduceMotion ? 0 : 1.1, delay: line * 0.025, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: "48vw" }}
                />
            ))}

            {sparkles.map((sparkle) => (
                <span
                    key={`sparkle-${sparkle.id}`}
                    className="pointer-events-none absolute rounded-full bg-[#fffdf7]"
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                        width: `${sparkle.size}px`,
                        height: `${Math.max(3, sparkle.size * 0.18)}px`,
                        boxShadow: "0 0 20px rgba(255,253,247,0.85)",
                        animation: `sparkle-pulse 1.4s ${sparkle.delay}s ease-in-out infinite`,
                        opacity: frozen ? 0.45 : 0.8,
                        transform: `rotate(${sparkle.id * 26}deg)`,
                    }}
                />
            ))}

            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    className="pointer-events-none absolute top-0"
                    style={{
                        left: `${piece.x}%`,
                        top: `${piece.y}%`,
                        width: `${piece.size}px`,
                        height: `${piece.size * 0.62}px`,
                        background: piece.color,
                        borderRadius: "999px",
                        transform: `rotate(${piece.rotation}deg)`,
                        animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in forwards`,
                        ["--confetti-drift" as string]: `${piece.drift}vw`,
                        opacity: frozen ? 0.4 : 0,
                    }}
                />
            ))}

            <motion.div
                className="relative z-10 flex min-h-[72vh] w-[min(95vw,1720px)] items-center justify-center rounded-[42px] border-4 border-[#F1C93A] bg-[#fffef8]/96 px-8 py-10 text-center shadow-[0_24px_48px_rgba(11,78,162,0.2)] md:px-14 md:py-16"
                initial={false}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 14, scale: visible ? 1 : 0.985 }}
                transition={{ duration: reduceMotion || frozen ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="pointer-events-none absolute left-10 top-0 h-10 w-24 -translate-y-1/2 rotate-[-5deg] rounded-md bg-[#f1c93a]/88 md:left-16 md:h-12 md:w-28" />
                <div className="pointer-events-none absolute right-10 top-0 h-10 w-24 -translate-y-1/2 rotate-[4deg] rounded-md bg-[#0b4ea2]/20 md:right-16 md:h-12 md:w-28" />
                <p
                    className="mx-auto text-balance font-semibold text-[#0b3e86]"
                    style={{
                        fontSize: "clamp(4rem, 10vw, 10.5rem)",
                        lineHeight: 0.92,
                        maxWidth: "14ch",
                    }}
                >
                    {message || ""}
                </p>
            </motion.div>
        </div>
    );
}
