"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { BroadcastMetric, BroadcastPanel, BroadcastStatusPill } from "@/components/shared/broadcast";

type ShellTone = "ops" | "stage";

type ShellMetric = {
    label: string;
    value: string;
    hint?: string;
};

function toneConfig(tone: ShellTone) {
    return tone === "ops"
        ? {
              accentTone: "cyan" as const,
              surfaceLabel: "ADMIN LOGIN",
              heroLabel: "Today's controls",
          }
        : {
              accentTone: "amber" as const,
              surfaceLabel: "DISPLAY UNLOCK",
              heroLabel: "Today's board",
          };
}

export function AuthShell({
    tone,
    badge,
    title,
    description,
    metrics,
    formLabel,
    formDescription,
    logoSrc,
    footerNote,
    children,
}: {
    tone: ShellTone;
    badge: string;
    title: string;
    description: string;
    metrics: ShellMetric[];
    formLabel: string;
    formDescription: string;
    logoSrc?: string | null;
    footerNote: string;
    children: ReactNode;
}) {
    const { accentTone, surfaceLabel, heroLabel } = toneConfig(tone);

    return (
        <main className="auth-shell broadcast-shell" data-surface={tone}>
            <motion.div
                className="auth-shell__beam auth-shell__beam--cyan"
                aria-hidden
                animate={{ x: [0, 20, 0], y: [0, -12, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="auth-shell__beam auth-shell__beam--amber"
                aria-hidden
                animate={{ x: [0, -16, 0], y: [0, 10, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />

            <div className="auth-shell__layout">
                <motion.div
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                    <BroadcastPanel className="auth-shell__panel auth-shell__panel--story">
                        <div className="auth-shell__rail">
                            <span className="auth-shell__eyebrow">{surfaceLabel}</span>
                            <BroadcastStatusPill tone={accentTone} label={badge} />
                        </div>

                        <div className="auth-shell__logoSlot">
                            {logoSrc ? (
                                <img src={logoSrc} alt="Event logo" className="auth-shell__logo" />
                            ) : (
                                <div className="auth-shell__wordmark">
                                    <span className="auth-shell__wordmarkTitle">Dance Marathon</span>
                                    <span className="auth-shell__wordmarkSubline">Donation board</span>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-5">
                            <p className="auth-shell__eyebrow">{heroLabel}</p>
                            <h1 className="auth-shell__title">{title}</h1>
                            <p className="auth-shell__description">{description}</p>
                        </div>

                        <div className="auth-shell__metrics">
                            {metrics.map((metric) => (
                                <BroadcastMetric
                                    key={metric.label}
                                    label={metric.label}
                                    value={metric.value}
                                    hint={metric.hint}
                                />
                            ))}
                        </div>

                        <p className="auth-shell__note">{footerNote}</p>
                    </BroadcastPanel>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                    <BroadcastPanel className="auth-shell__panel auth-shell__panel--form broadcast-panel--flat">
                        <div className="auth-shell__formHeader">
                            <span className="auth-shell__eyebrow">{formLabel}</span>
                            <p className="auth-shell__formCopy">{formDescription}</p>
                        </div>

                        <div className="auth-shell__formBody">{children}</div>
                    </BroadcastPanel>
                </motion.div>
            </div>
        </main>
    );
}
