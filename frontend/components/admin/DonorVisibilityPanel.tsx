import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import CommandButton from "@/components/shared/CommandButton";

type DonorVisibilityPanelProps = {
  showDonorNames: boolean;
  onToggle: () => void;
};

export default function DonorVisibilityPanel({
  showDonorNames,
  onToggle,
}: DonorVisibilityPanelProps) {
  return (
    <PanelFrame>
      <SectionHeader
        eyebrow="Privacy Toggle"
        title="Donor display name visibility"
        description="The donations scene still respects DonorDrive privacy settings even when names are enabled."
      />

      <CommandButton tone={showDonorNames ? "primary" : "secondary"} onClick={onToggle}>
        {showDonorNames ? "Names Visible On-Air" : "Names Hidden On-Air"}
      </CommandButton>
    </PanelFrame>
  );
}
