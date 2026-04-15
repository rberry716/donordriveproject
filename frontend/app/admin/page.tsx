"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { BroadcastButton, BroadcastField, BroadcastStatusPill } from "@/components/shared/broadcast";
import { setAdminSession } from "@/lib/auth-storage";

const EVENT_LOGO = process.env.NEXT_PUBLIC_EVENT_LOGO_PNG?.trim() || null;

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        if (!email.trim() || !password.trim()) return;

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => ({} as { error?: string }));

            if (!res.ok) {
                setError(data.error || "Invalid credentials");
                return;
            }

            setAdminSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
            router.push("/admin/dashboard");
        } catch {
            setError("Connection error, please try again");
        } finally {
            setLoading(false);
        }
    }

    function clearError() {
        if (error) setError("");
    }

    return (
        <AuthShell
            tone="ops"
            badge={loading ? "SIGNING IN" : "ADMIN"}
            title="Admin Login"
            description="Sign in to update today's display and send scenes when you're ready."
            metrics={[
                { label: "Today", value: todayLabel, hint: "Applies to today's board." },
                { label: "Access", value: "Staff only", hint: "Email and password." },
                { label: "Surface", value: "Admin", hint: "Control screen." },
            ]}
            formLabel="Sign in"
            formDescription="Use your staff account to open the dashboard."
            logoSrc={EVENT_LOGO}
            footerNote="Keep this page on trusted devices only."
        >
            <form onSubmit={handleSubmit} className="grid gap-4">
                <BroadcastStatusPill tone={loading ? "neutral" : "cyan"} label={loading ? "Signing in" : "Ready"} />

                <BroadcastField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        clearError();
                    }}
                    placeholder="operator@event.org"
                    autoFocus
                    autoComplete="email"
                    disabled={loading}
                    hint="Use the staff account for the board."
                />

                <BroadcastField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                    }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={loading}
                    error={error ? error : undefined}
                    hint="Enter the password for your staff account."
                />

                {error ? (
                    <p className="auth-shell__alert" role="alert">
                        {error}
                    </p>
                ) : (
                    <p className="auth-shell__helper">
                        This opens the admin board for today&apos;s display.
                    </p>
                )}

                <div className="auth-shell__formActions">
                    <BroadcastButton
                        type="submit"
                        loading={loading}
                        loadingLabel="Signing in..."
                        disabled={!email.trim() || !password.trim()}
                    >
                        Open admin
                    </BroadcastButton>
                </div>
            </form>
        </AuthShell>
    );
}
