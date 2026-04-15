"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, useId } from "react";

type Tone = "neutral" | "cyan" | "amber" | "success" | "danger";
type ButtonVariant = "primary" | "secondary" | "ghost";

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export function BroadcastPanel({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return <div className={cx("broadcast-panel", className)}>{children}</div>;
}

export function BroadcastStatusPill({
    tone = "neutral",
    label,
    className,
}: {
    tone?: Tone;
    label: string;
    className?: string;
}) {
    return <span className={cx("broadcast-pill", `broadcast-pill--${tone}`, className)}>{label}</span>;
}

export function BroadcastMetric({
    label,
    value,
    hint,
    className,
}: {
    label: string;
    value: string;
    hint?: string;
    className?: string;
}) {
    return (
        <div className={cx("broadcast-metric", className)}>
            <span className="broadcast-metric__label">{label}</span>
            <span className="broadcast-metric__value">{value}</span>
            {hint ? <span className="broadcast-metric__hint">{hint}</span> : null}
        </div>
    );
}

export function BroadcastField({
    label,
    hint,
    error,
    className,
    ...props
}: {
    label: string;
    hint?: string;
    error?: string;
    className?: string;
} & InputHTMLAttributes<HTMLInputElement> & {
        className?: string;
    }) {
    const baseId = useId();
    const hintId = hint ? `${baseId}-hint` : undefined;
    const errorId = error ? `${baseId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
        <label className={cx("broadcast-field", className)}>
            <span className="broadcast-field__label">{label}</span>
            <input
                {...props}
                aria-invalid={error ? true : props["aria-invalid"]}
                aria-describedby={describedBy}
                className="broadcast-input"
            />
            {hint ? (
                <span id={hintId} className="broadcast-field__hint">
                    {hint}
                </span>
            ) : null}
            {error ? (
                <span id={errorId} className="broadcast-field__error" role="alert">
                    {error}
                </span>
            ) : null}
        </label>
    );
}

export function BroadcastButton({
    variant = "primary",
    loading = false,
    loadingLabel = "Processing...",
    className,
    children,
    disabled,
    ...props
}: {
    variant?: ButtonVariant;
    loading?: boolean;
    loadingLabel?: string;
    className?: string;
    children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
    const isDisabled = disabled || loading;

    return (
        <button
            {...props}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={cx("broadcast-button", `broadcast-button--${variant}`, className)}
        >
            <span className="broadcast-button__content">
                {loading ? <span className="broadcast-button__spinner" aria-hidden /> : null}
                <span>{loading ? loadingLabel : children}</span>
            </span>
        </button>
    );
}
