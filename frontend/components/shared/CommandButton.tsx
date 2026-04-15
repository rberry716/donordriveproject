import type { ButtonHTMLAttributes, ReactNode } from "react";

type CommandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

export default function CommandButton({
  children,
  className = "",
  tone = "secondary",
  icon,
  ...props
}: CommandButtonProps) {
  const toneClass =
    tone === "primary"
      ? "border-[rgba(67,229,255,0.5)] bg-[rgba(67,229,255,0.14)] text-[var(--text-primary)] hover:bg-[rgba(67,229,255,0.2)]"
      : tone === "danger"
        ? "border-[rgba(255,92,122,0.42)] bg-[rgba(255,92,122,0.12)] text-[var(--danger)] hover:bg-[rgba(255,92,122,0.18)]"
        : tone === "ghost"
          ? "border-[rgba(255,255,255,0.1)] bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.09)]";

  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-medium transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-40",
        toneClass,
        className,
      ].join(" ")}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
