import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p>
        ) : null}
        <h2 className="text-[1.15rem] font-semibold tracking-[0.04em] text-[var(--text-primary)]">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
