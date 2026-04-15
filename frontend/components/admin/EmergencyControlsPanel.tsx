import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import CommandButton from "@/components/shared/CommandButton";

type EmergencyControlsPanelProps = {
  frozen: boolean;
  onFreezeToggle: () => void;
  onStandby: () => void;
};

export default function EmergencyControlsPanel({
  frozen,
  onFreezeToggle,
  onStandby,
}: EmergencyControlsPanelProps) {
  return (
    <PanelFrame tone="danger">
      <SectionHeader
        eyebrow="Emergency Controls"
        title="Hard-stop actions"
        description="Freeze holds the exact current frame. Standby returns the program feed to the branded holding screen."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <CommandButton tone="danger" onClick={onFreezeToggle}>
          {frozen ? "Release Freeze" : "Freeze Output"}
        </CommandButton>
        <CommandButton tone="secondary" onClick={onStandby}>
          Send Program To Standby
        </CommandButton>
      </div>
    </PanelFrame>
  );
}
