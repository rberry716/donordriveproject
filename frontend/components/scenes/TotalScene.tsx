"use client";

import { useEffect, useState, useRef } from "react";

const EVENT_LOGO = process.env.NEXT_PUBLIC_EVENT_LOGO_PNG;

function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatDollar(value: number): string {
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TotalScene({ amount, frozen = false }: { amount: number; frozen?: boolean }) {
    const [displayAmount, setDisplayAmount] = useState(0);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const duration = frozen ? 0 : 3800;

    useEffect(() => {
        if (!amount || amount <= 0 || frozen) {
            setDisplayAmount(Math.max(0, amount || 0));
            return;
        }

        startTimeRef.current = null;

        function animate(timestamp: number) {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);

            setDisplayAmount(eased * amount);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        }

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [amount, frozen]);

    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#edf5ff] px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.72),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(241,201,58,0.22),_transparent_30%)]" />

            <div className="relative flex w-full max-w-6xl items-center justify-center">
                <div className="relative flex min-h-[30rem] w-full flex-col items-center justify-center rounded-[34px] border-4 border-[#f1c93a] bg-[#fffef8] px-8 py-12 text-center shadow-[0_20px_40px_rgba(11,78,162,0.18)] md:px-12">
                    {EVENT_LOGO ? (
                        <img
                            src={EVENT_LOGO}
                            alt=""
                            className="mb-10 h-16 w-16 object-contain opacity-90"
                        />
                    ) : null}
                    <p
                        className="font-mono font-semibold tabular-nums text-[#0b3e86]"
                        style={{
                            fontSize: "clamp(4rem, 12vw, 11rem)",
                            lineHeight: 0.92,
                        }}
                    >
                        {formatDollar(displayAmount)}
                    </p>
                </div>
            </div>
        </div>
    );
}
