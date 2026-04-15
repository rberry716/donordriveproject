import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import { TEMPLATE_METADATA } from "@/lib/display-config";
import type { LayoutTemplate } from "@/types/display";

type LayoutTemplatePickerProps = {
  selected: LayoutTemplate;
  onSelect: (value: LayoutTemplate) => void;
};

export default function LayoutTemplatePicker({ selected, onSelect }: LayoutTemplatePickerProps) {
  return (
    <PanelFrame>
      <SectionHeader
        eyebrow="Program Layout"
        title="Choose a broadcast canvas"
        description="Each template defines slot count and whether the lower utility rail is active."
      />

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {TEMPLATE_METADATA.map((template) => {
          const active = template.value === selected;

          return (
            <button
              key={template.value}
              onClick={() => onSelect(template.value)}
              className={[
                "group rounded-[12px] border p-4 text-left transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                active
                  ? "border-[rgba(67,229,255,0.42)] bg-[rgba(67,229,255,0.08)]"
                  : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(67,229,255,0.18)] hover:bg-[rgba(255,255,255,0.05)]",
              ].join(" ")}
            >
              <div className="mb-4 flex h-16 gap-1 rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[rgba(3,7,11,0.66)] p-2">
                {template.columns.map((column, index) => (
                  <div
                    key={`${template.value}-${index}`}
                    className="relative h-full rounded-[4px] bg-[rgba(255,255,255,0.08)]"
                    style={{ width: column }}
                  >
                    <div className="absolute inset-1 rounded-[3px] border border-[rgba(67,229,255,0.08)]" />
                  </div>
                ))}
              </div>

              {template.hasBar ? <div className="mb-3 h-2 rounded-full bg-[rgba(255,176,0,0.24)]" /> : <div className="mb-3 h-2 rounded-full bg-transparent" />}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">{template.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {template.slotCount} slot{template.slotCount === 1 ? "" : "s"} programmed
                  </p>
                </div>
                <span className={active ? "text-[var(--accent-cyan)]" : "text-[var(--text-muted)]"}>●</span>
              </div>
            </button>
          );
        })}
      </div>
    </PanelFrame>
  );
}
