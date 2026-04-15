import MetricStrip from "@/components/shared/MetricStrip";
import CommandButton from "@/components/shared/CommandButton";
import StatusChip from "@/components/shared/StatusChip";
import { formatRelativeTime, formatTimestamp } from "@/lib/format";
import type { DisplayState, DisplayStatusResponse } from "@/types/display";

type AdminTopBarProps = {
  state: DisplayState;
  status: DisplayStatusResponse;
  saving: boolean;
  onRefresh: () => void;
};

export default function AdminTopBar({ state, status, saving, onRefresh }: AdminTopBarProps) {
  const lastScene = typeof status.lastEvent?.payload?.scene === "string" ? status.lastEvent.payload.scene : "Idle";

  return (
    <div className="sticky top-0 z-20 mb-8 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(5,7,11,0.92)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1500px] px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip
                label={`${status.connectedCount} display${status.connectedCount === 1 ? "" : "s"} online`}
                tone={status.connectedCount > 0 ? "success" : "danger"}
              />
              <StatusChip label={state.frozen ? "Frozen" : "Live Output"} tone={state.frozen ? "danger" : "live"} />
              <StatusChip
                label={state.activeOverride ? `Override: ${state.activeOverride}` : "Program Feed"}
                tone={state.activeOverride ? "accent" : "muted"}
              />
              <StatusChip label={saving ? "Applying change" : "Console ready"} tone={saving ? "warning" : "muted"} />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">Director Console</p>
              <h1 className="mt-1 text-[2rem] font-semibold tracking-[0.04em] text-[var(--text-primary)] sm:text-[2.4rem]">
                Broadcast Control Surface
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
                Program the venue display, manage live overrides, and keep the projector feed readable and in sync.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[620px]">
            <MetricStrip label="Last Command" value={lastScene} detail={formatRelativeTime(status.lastEvent?.timestamp)} tone="cyan" />
            <MetricStrip
              label="Program Layout"
              value={state.layoutTemplate.replace(/_/g, " ")}
              detail={`Cycle ${state.autoCycleEnabled ? "enabled" : "paused"}`}
            />
            <MetricStrip
              label="Updated"
              value={formatTimestamp(status.lastEvent?.timestamp)}
              detail={state.activeOverride ? "Operator override active" : "Base layout on-air"}
              tone="amber"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <CommandButton tone="ghost" onClick={onRefresh}>
            Refresh Telemetry
          </CommandButton>
        </div>
      </div>
    </div>
  );
}
