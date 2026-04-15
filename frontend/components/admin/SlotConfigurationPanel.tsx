import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import CommandButton from "@/components/shared/CommandButton";
import StatusChip from "@/components/shared/StatusChip";
import { LAYOUT_SCENES, getSceneLabel } from "@/lib/display-config";
import type { LayoutSceneId, SlotConfig } from "@/types/display";

type SlotConfigurationPanelProps = {
  slots: SlotConfig[];
  onChange: (slots: SlotConfig[]) => void;
};

export default function SlotConfigurationPanel({ slots, onChange }: SlotConfigurationPanelProps) {
  function updateSlot(index: number, nextSlot: SlotConfig) {
    const next = [...slots];
    next[index] = nextSlot;
    onChange(next);
  }

  function toggleType(index: number) {
    const slot = slots[index];
    if (slot.type === "pinned") {
      updateSlot(index, { type: "rotating", scenes: [slot.scene] });
      return;
    }

    updateSlot(index, { type: "pinned", scene: slot.scenes[0] ?? "STANDBY" });
  }

  function updatePinnedScene(index: number, scene: LayoutSceneId) {
    updateSlot(index, { type: "pinned", scene });
  }

  function toggleRotatingScene(index: number, scene: LayoutSceneId) {
    const slot = slots[index];
    if (slot.type !== "rotating") return;
    const nextScenes = slot.scenes.includes(scene)
      ? slot.scenes.filter((entry) => entry !== scene)
      : [...slot.scenes, scene];

    if (nextScenes.length === 0) return;
    updateSlot(index, { type: "rotating", scenes: nextScenes });
  }

  function moveScene(index: number, direction: -1 | 1, sceneIndex: number) {
    const slot = slots[index];
    if (slot.type !== "rotating") return;
    const target = sceneIndex + direction;
    if (target < 0 || target >= slot.scenes.length) return;
    const nextScenes = [...slot.scenes];
    [nextScenes[sceneIndex], nextScenes[target]] = [nextScenes[target], nextScenes[sceneIndex]];
    updateSlot(index, { type: "rotating", scenes: nextScenes });
  }

  return (
    <PanelFrame>
      <SectionHeader
        eyebrow="Slot Programming"
        title="Assign the screen stack"
        description="Pinned slots stay fixed; rotating slots sequence through scenes on the cycle timer."
      />

      <div className="space-y-4">
        {slots.map((slot, index) => (
          <div
            key={`slot-${index}`}
            className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">Slot {index + 1}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {slot.type === "pinned" ? "Locked to one scene" : "Local rotation list"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusChip
                  label={slot.type === "pinned" ? "Pinned" : "Rotating"}
                  tone={slot.type === "pinned" ? "muted" : "live"}
                />
                <CommandButton tone="ghost" onClick={() => toggleType(index)}>
                  {slot.type === "pinned" ? "Convert to rotation" : "Lock to one scene"}
                </CommandButton>
              </div>
            </div>

            {slot.type === "pinned" ? (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {LAYOUT_SCENES.map((scene) => (
                  <button
                    key={scene}
                    onClick={() => updatePinnedScene(index, scene)}
                    className={[
                      "rounded-[10px] border px-4 py-3 text-left transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      slot.scene === scene
                        ? "border-[rgba(67,229,255,0.42)] bg-[rgba(67,229,255,0.1)] text-[var(--text-primary)]"
                        : "border-[rgba(255,255,255,0.08)] bg-[rgba(3,7,11,0.58)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                      {getSceneLabel(scene)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {LAYOUT_SCENES.map((scene) => {
                    const active = slot.scenes.includes(scene);
                    return (
                      <button
                        key={scene}
                        onClick={() => toggleRotatingScene(index, scene)}
                        className={[
                          "rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          active
                            ? "border-[rgba(67,229,255,0.36)] bg-[rgba(67,229,255,0.12)] text-[var(--text-primary)]"
                            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]",
                        ].join(" ")}
                      >
                        {getSceneLabel(scene)}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {slot.scenes.map((scene, sceneIndex) => (
                    <div
                      key={`${scene}-${sceneIndex}`}
                      className="flex items-center gap-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(3,7,11,0.58)] px-3 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,176,0,0.25)] bg-[rgba(255,176,0,0.08)] text-sm font-semibold tabular-nums text-[var(--accent-amber)]">
                        {sceneIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-primary)]">
                          {getSceneLabel(scene)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <CommandButton tone="ghost" disabled={sceneIndex === 0} onClick={() => moveScene(index, -1, sceneIndex)}>
                          Up
                        </CommandButton>
                        <CommandButton
                          tone="ghost"
                          disabled={sceneIndex === slot.scenes.length - 1}
                          onClick={() => moveScene(index, 1, sceneIndex)}
                        >
                          Down
                        </CommandButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}
