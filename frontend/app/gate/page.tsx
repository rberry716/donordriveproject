"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { BroadcastButton, BroadcastField, BroadcastStatusPill } from "@/components/shared/broadcast";
import { markDisplayPasscodeVerified } from "@/lib/auth-storage";

const EVENT_LOGO = process.env.NEXT_PUBLIC_EVENT_LOGO_PNG?.trim() || null;

export default function GatePage() {
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const todayLabel = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(new Date());

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!passcode.trim()) return;

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/passcode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passcode }),
            });

            if (res.status === 429) {
                setError("Too many attempts, please wait");
                setPasscode("");
                return;
            }

            if (!res.ok) {
                setError("Invalid passcode");
                setPasscode("");
                return;
            }

            markDisplayPasscodeVerified();
            router.replace("/display");
        } catch {
            setError("Connection error, please try again");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell
            tone="stage"
            badge={loading ? "CHECKING" : "DISPLAY"}
            title="Display Unlock"
            description="Enter the passcode to open today's display."
            metrics={[
                { label: "Today", value: todayLabel, hint: "Shows today's board." },
                { label: "Access", value: "Passcode", hint: "Venue code required." },
                { label: "Surface", value: "Display", hint: "Projector page." },
            ]}
            formLabel="Passcode"
            formDescription="Use the event passcode to unlock the display."
            logoSrc={EVENT_LOGO}
            footerNote="This page stays locked until the correct passcode is entered."
        >
            <form onSubmit={handleSubmit} className="grid gap-4">
                <BroadcastStatusPill tone={loading ? "neutral" : "amber"} label={loading ? "Checking" : "Ready"} />

                <BroadcastField
                    label="Passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => {
                        setPasscode(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="Enter passcode"
                    autoFocus
                    autoComplete="one-time-code"
                    disabled={loading}
                    error={error ? error : undefined}
                    hint="Enter the passcode for the projector screen."
                />

                {error ? (
                    <p className="auth-shell__alert" role="alert">
                        {error}
                    </p>
                ) : (
                    <p className="auth-shell__helper">
                        The display opens right away after a correct passcode.
                    </p>
                )}

                <div className="auth-shell__formActions">
                    <BroadcastButton
                        type="submit"
                        loading={loading}
                        loadingLabel="Verifying..."
                        disabled={!passcode.trim()}
                    >
                        Open display
                    </BroadcastButton>
                </div>
            </form>
        </AuthShell>
    );
}
