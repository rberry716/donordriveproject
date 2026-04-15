import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import { FormField, SelectInput, TextInput } from "@/components/shared/FormField";
import type { ProgressBarConfig, ProgressBarType } from "@/types/display";
import {
  buildQuarterHourOptions,
  formatTimeOnly,
  isoFromTimeOptionValue,
  timeOptionValueFromIso,
} from "./utils";

type ProgressBarPanelProps = {
  enabled: boolean;
  value: ProgressBarConfig;
  onChange: (updates: Partial<ProgressBarConfig>) => void;
};

export default function ProgressBarPanel({ enabled, value, onChange }: ProgressBarPanelProps) {
  const timeOptions = buildQuarterHourOptions();
  const startValue = timeOptionValueFromIso(value.startTime);
  const endValue = timeOptionValueFromIso(value.endTime);
  const withSelectedValue = (selectedValue: string, isoValue: string | null | undefined) => {
    if (!selectedValue || timeOptions.some((option) => option.value === selectedValue)) {
      return timeOptions;
    }

    return [
      {
        value: selectedValue,
        label: `Saved: ${formatTimeOnly(isoValue)}`,
        iso: isoValue || "",
      },
      ...timeOptions,
    ];
  };

  return (
    <PanelFrame className={!enabled ? "opacity-70" : ""}>
      <SectionHeader
        eyebrow="Lower Rail"
        title="Progress rail configuration"
        description={
          enabled
            ? "Bar layouts use the hourly aggregate feed for live progress."
            : "Switch to a _BAR template to program the utility rail."
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Metric" hint="Live aggregate available from the current backend feed">
          <SelectInput
            value={value.type ?? ""}
            disabled={!enabled}
            onChange={(event) => onChange({ type: (event.target.value || null) as ProgressBarType | null })}
          >
            <option value="">Select aggregate</option>
            <option value="PERIOD_TOTAL">Period Total</option>
            <option value="DONATION_COUNT">Donation Count</option>
          </SelectInput>
        </FormField>

        <FormField label="Goal" hint="Displayed as the target on the lower rail">
          <TextInput
            type="number"
            disabled={!enabled}
            value={value.goal ?? ""}
            onChange={(event) => onChange({ goal: Number(event.target.value) || null })}
            placeholder="5000"
          />
        </FormField>

        <FormField label="Start" hint="Quarter-hour dropdown saved on today's date">
          <SelectInput
            disabled={!enabled}
            value={startValue}
            onChange={(event) =>
              onChange({
                startTime: isoFromTimeOptionValue(event.target.value),
              })
            }
          >
            <option value="">Choose a start time</option>
            {withSelectedValue(startValue, value.startTime).map((option) => (
              <option key={`progress-start-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="End" hint="Quarter-hour dropdown saved on today's date">
          <SelectInput
            disabled={!enabled}
            value={endValue}
            onChange={(event) =>
              onChange({
                endTime: isoFromTimeOptionValue(event.target.value),
              })
            }
          >
            <option value="">Choose an end time</option>
            {withSelectedValue(endValue, value.endTime).map((option) => (
              <option key={`progress-end-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </div>
    </PanelFrame>
  );
}
