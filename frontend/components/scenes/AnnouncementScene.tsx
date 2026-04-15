"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnnouncementScene({
    message,
    fontSize,
    frozen = false,
}: {
    message: string;
    fontSize?: number;
    frozen?: boolean;
}) {
    const [visible, setVisible] = useState(false);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        setVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setVisible(true);
            });
        });
    }, [message]);

    const size = fontSize || 64;

    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#edf5ff] px-4 py-4 md:px-8 md:py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.72),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(241,201,58,0.22),_transparent_34%),linear-gradient(135deg,rgba(11,78,162,0.08),transparent_32%,rgba(241,201,58,0.08)_100%)]" />
            <div className="pointer-events-none absolute inset-x-[8%] top-[10%] h-16 rounded-full bg-[#f1c93a]/18 blur-3xl md:h-24" />
            <div className="pointer-events-none absolute inset-x-[14%] bottom-[12%] h-20 rounded-full bg-[#0b4ea2]/12 blur-3xl md:h-28" />

            <motion.div
                className="relative flex min-h-[70vh] w-[min(94vw,1700px)] items-center justify-center rounded-[40px] border-4 border-[#f1c93a] bg-[#fffef8] px-8 py-10 text-center shadow-[0_24px_48px_rgba(11,78,162,0.18)] md:px-14 md:py-14"
                initial={false}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 18, scale: visible ? 1 : 0.985 }}
                transition={{ duration: reduceMotion || frozen ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="pointer-events-none absolute left-8 top-0 h-10 w-24 -translate-y-1/2 rotate-[-4deg] rounded-md bg-[#f1c93a]/85 md:left-16 md:h-12 md:w-28" />
                <div className="pointer-events-none absolute right-8 top-0 h-10 w-24 -translate-y-1/2 rotate-[5deg] rounded-md bg-[#0b4ea2]/20 md:right-16 md:h-12 md:w-28" />
                <div className="pointer-events-none absolute inset-x-10 bottom-6 h-4 rounded-full bg-[#0b4ea2]/6 blur-2xl md:inset-x-20 md:bottom-8" />
                <p
                    className="mx-auto text-balance font-semibold text-[#0b3e86]"
                    style={{
                        fontSize: `clamp(${Math.max(52, size)}px, ${Math.max(9.5, size / 6)}vw, ${Math.max(120, size * 2.25)}px)`,
                        lineHeight: 0.94,
                        maxWidth: "15ch",
                    }}
                >
                    {message || ""}
                </p>
            </motion.div>
        </div>
    );
}
