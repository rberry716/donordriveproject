type StatusChipProps = {
  label: string;
  tone?: "live" | "accent" | "muted" | "danger" | "success" | "warning";
};

const TONE_CLASS: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  live: "border-[rgba(67,229,255,0.35)] text-[var(--accent-cyan)] bg-[rgba(67,229,255,0.09)]",
  accent: "border-[rgba(255,176,0,0.35)] text-[var(--accent-amber)] bg-[rgba(255,176,0,0.09)]",
  muted: "border-[rgba(255,255,255,0.12)] text-[var(--text-secondary)] bg-[rgba(255,255,255,0.04)]",
  danger: "border-[rgba(255,92,122,0.4)] text-[var(--danger)] bg-[rgba(255,92,122,0.09)]",
  success: "border-[rgba(67,209,122,0.4)] text-[var(--success)] bg-[rgba(67,209,122,0.09)]",
  warning: "border-[rgba(255,176,0,0.35)] text-[var(--accent-amber)] bg-[rgba(255,176,0,0.09)]",
};

export default function StatusChip({ label, tone = "muted" }: StatusChipProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        TONE_CLASS[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
