import type { ReactNode } from "react";

type MetricStripProps = {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "cyan" | "amber" | "default";
};

export default function MetricStrip({ label, value, detail, tone = "default" }: MetricStripProps) {
  return (
    <div
      className={[
        "rounded-[10px] border px-4 py-3",
        tone === "cyan"
          ? "border-[rgba(67,229,255,0.2)] bg-[rgba(67,229,255,0.06)]"
          : tone === "amber"
            ? "border-[rgba(255,176,0,0.2)] bg-[rgba(255,176,0,0.06)]"
            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]",
      ].join(" ")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 text-[1.4rem] font-semibold tabular-nums text-[var(--text-primary)]">{value}</div>
      {detail ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p> : null}
    </div>
  );
}
