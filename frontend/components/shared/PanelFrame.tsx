import type { ReactNode } from "react";

type PanelFrameProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "subtle" | "danger";
};

export default function PanelFrame({ children, className = "", tone = "default" }: PanelFrameProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-[12px] border p-5",
        tone === "danger"
          ? "border-[rgba(255,92,122,0.45)] bg-[rgba(42,11,20,0.9)]"
          : tone === "subtle"
            ? "border-[rgba(255,255,255,0.08)] bg-[rgba(12,18,26,0.72)]"
            : "border-[rgba(67,229,255,0.12)] bg-[rgba(12,18,26,0.92)]",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(67,229,255,0.05),transparent_22%,transparent_78%,rgba(255,176,0,0.03))]" />
      <div className="relative">{children}</div>
    </section>
  );
}
