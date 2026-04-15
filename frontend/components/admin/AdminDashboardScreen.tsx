"use client";

import AdminTopBar from "./AdminTopBar";
import LayoutTemplatePicker from "./LayoutTemplatePicker";
import SlotConfigurationPanel from "./SlotConfigurationPanel";
import ProgressBarPanel from "./ProgressBarPanel";
import AutoCyclePanel from "./AutoCyclePanel";
import DonorVisibilityPanel from "./DonorVisibilityPanel";
import OverrideConsole from "./OverrideConsole";
import EmergencyControlsPanel from "./EmergencyControlsPanel";
import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import StatusChip from "@/components/shared/StatusChip";
import { getTemplateMeta } from "@/lib/display-config";
import { formatRelativeTime } from "@/lib/format";
import type { DisplayState, DisplayStatusResponse, PersistentOverride } from "@/types/display";

type AdminDashboardScreenProps = {
  state: DisplayState;
  status: DisplayStatusResponse;
  saving: boolean;
  error: string;
  onRefresh: () => void;
  onUpdateState: (updates: Partial<DisplayState>) => void;
  onSetOverride: (override: NonNullable<PersistentOverride>) => void;
  onClearOverride: () => void;
  onToggleFreeze: () => void;
  onSendStandby: () => void;
};

export default function AdminDashboardScreen({
  state,
  status,
  saving,
  error,
  onRefresh,
  onUpdateState,
  onSetOverride,
  onClearOverride,
  onToggleFreeze,
  onSendStandby,
}: AdminDashboardScreenProps) {
  const template = getTemplateMeta(state.layoutTemplate);

  function updateTemplate(layoutTemplate: DisplayState["layoutTemplate"]) {
    const slotCount = getTemplateMeta(layoutTemplate).slotCount;
    const nextSlots = Array.from({ length: slotCount }, (_, index) => state.slots[index] ?? { type: "pinned" as const, scene: "STANDBY" });
    onUpdateState({ layoutTemplate, slots: nextSlots });
  }

  const activeOverride =
    state.activeOverride === "TOTAL" || state.activeOverride === "ANNOUNCEMENT" || state.activeOverride === "MILESTONE"
      ? {
          scene: state.activeOverride,
          payload: (state.overridePayload as Record<string, unknown> | null) ?? undefined,
        }
      : null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AdminTopBar state={state} status={status} saving={saving} onRefresh={onRefresh} />

      <main className="mx-auto max-w-[1500px] px-5 pb-12 sm:px-8">
        {error ? (
          <div className="mb-6 rounded-[12px] border border-[rgba(255,92,122,0.32)] bg-[rgba(255,92,122,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_380px]">
          <div className="space-y-6">
            <LayoutTemplatePicker selected={state.layoutTemplate} onSelect={updateTemplate} />
            <SlotConfigurationPanel slots={state.slots} onChange={(slots) => onUpdateState({ slots })} />
            <ProgressBarPanel
              enabled={template.hasBar}
              value={{
                type: state.progressBarType,
                goal: state.progressBarGoal,
                startTime: state.progressBarStartTime,
                endTime: state.progressBarEndTime,
              }}
              onChange={(updates) =>
                onUpdateState({
                  progressBarType: updates.type !== undefined ? updates.type : state.progressBarType,
                  progressBarGoal: updates.goal !== undefined ? updates.goal : state.progressBarGoal,
                  progressBarStartTime: updates.startTime !== undefined ? updates.startTime : state.progressBarStartTime,
                  progressBarEndTime: updates.endTime !== undefined ? updates.endTime : state.progressBarEndTime,
                })
              }
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <AutoCyclePanel
                enabled={state.autoCycleEnabled}
                intervalSec={state.autoCycleIntervalSec}
                onToggle={() => onUpdateState({ autoCycleEnabled: !state.autoCycleEnabled })}
                onIntervalChange={(autoCycleIntervalSec) => onUpdateState({ autoCycleIntervalSec })}
              />
              <DonorVisibilityPanel
                showDonorNames={state.showDonorNames}
                onToggle={() => onUpdateState({ showDonorNames: !state.showDonorNames })}
              />
            </div>
          </div>

          <aside className="space-y-6">
            <PanelFrame>
              <SectionHeader
                eyebrow="Operational Telemetry"
                title="Display network"
                description="Polled status from the backend. The command stamp reflects the last acknowledged director event."
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Connected Displays
                    </p>
                    <p className="mt-2 text-[1.7rem] font-semibold tabular-nums text-[var(--text-primary)]">
                      {status.connectedCount}
                    </p>
                  </div>
                  <StatusChip
                    label={status.connectedCount > 0 ? "Signal Live" : "No Clients"}
                    tone={status.connectedCount > 0 ? "success" : "danger"}
                  />
                </div>

                <div className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Last Director Event
                  </p>
                  <p className="mt-2 text-base font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">
                    {typeof status.lastEvent?.payload?.scene === "string" ? status.lastEvent.payload.scene : "Awaiting command"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {formatRelativeTime(status.lastEvent?.timestamp)}
                  </p>
                </div>
              </div>
            </PanelFrame>

            <OverrideConsole
              activeOverride={activeOverride}
              onPush={onSetOverride}
              onClear={onClearOverride}
            />
            <EmergencyControlsPanel frozen={state.frozen} onFreezeToggle={onToggleFreeze} onStandby={onSendStandby} />
          </aside>
        </div>
      </main>
    </div>
  );
}
