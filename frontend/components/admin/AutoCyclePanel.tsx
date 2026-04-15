import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import CommandButton from "@/components/shared/CommandButton";
import { FormField, TextInput } from "@/components/shared/FormField";

type AutoCyclePanelProps = {
  enabled: boolean;
  intervalSec: number;
  onToggle: () => void;
  onIntervalChange: (value: number) => void;
};

export default function AutoCyclePanel({
  enabled,
  intervalSec,
  onToggle,
  onIntervalChange,
}: AutoCyclePanelProps) {
  return (
    <PanelFrame>
      <SectionHeader
        eyebrow="Rotation Engine"
        title="Control slot cycling"
        description="Rotation happens locally on displays, but only while cycle mode is enabled and the output is not frozen."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="lg:w-56">
          <FormField label="Interval" hint="Seconds between slot advances">
            <TextInput
              type="number"
              min={5}
              max={300}
              value={intervalSec}
              onChange={(event) => onIntervalChange(Number(event.target.value) || 30)}
            />
          </FormField>
        </div>

        <CommandButton tone={enabled ? "primary" : "secondary"} onClick={onToggle}>
          {enabled ? "Pause Auto-Cycle" : "Enable Auto-Cycle"}
        </CommandButton>
      </div>
    </PanelFrame>
  );
}
