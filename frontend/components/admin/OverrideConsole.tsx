"use client";

import { useState } from "react";
import PanelFrame from "@/components/shared/PanelFrame";
import SectionHeader from "@/components/shared/SectionHeader";
import CommandButton from "@/components/shared/CommandButton";
import { FormField, TextArea, TextInput } from "@/components/shared/FormField";
import type { PersistentOverride } from "@/types/display";

type OverrideConsoleProps = {
  activeOverride: PersistentOverride;
  onPush: (override: NonNullable<PersistentOverride>) => void;
  onClear: () => void;
};

export default function OverrideConsole({
  activeOverride,
  onPush,
  onClear,
}: OverrideConsoleProps) {
  const [milestoneMessage, setMilestoneMessage] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementSize, setAnnouncementSize] = useState("92");
  const [totalAmount, setTotalAmount] = useState("");

  return (
    <PanelFrame>
      <SectionHeader
        eyebrow="Live Overrides"
        title="Take the feed full-screen"
        description="TOTAL, ANNOUNCEMENT, and MILESTONE overrides stay active until cleared."
        action={
          activeOverride ? (
            <CommandButton tone="danger" onClick={onClear}>
              Clear Active Override
            </CommandButton>
          ) : null
        }
      />

      {activeOverride ? (
        <div className="mb-5 rounded-[12px] border border-[rgba(255,176,0,0.26)] bg-[rgba(255,176,0,0.08)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-amber)]">
            On Air Now
          </p>
          <p className="mt-2 text-lg font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">
            {activeOverride.scene}
          </p>
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
          <FormField label="Milestone Message" hint="Persistent celebration until cleared">
            <TextArea
              rows={3}
              value={milestoneMessage}
              onChange={(event) => setMilestoneMessage(event.target.value)}
              placeholder="Goal crossed. Keep pushing for the next total."
            />
          </FormField>
          <div className="mt-4">
            <CommandButton
              tone="primary"
              disabled={!milestoneMessage.trim()}
              onClick={() => {
                onPush({ scene: "MILESTONE", payload: { message: milestoneMessage.trim() } });
                setMilestoneMessage("");
              }}
            >
              Push Milestone
            </CommandButton>
          </div>
        </div>

        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="grid gap-4">
            <FormField label="Announcement" hint="Large-stage message takeover">
              <TextArea
                rows={3}
                value={announcementMessage}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                placeholder="Line up on the floor in five minutes."
              />
            </FormField>

            <FormField label="Font Size" hint="Pixels for the stage type treatment">
              <TextInput
                type="number"
                value={announcementSize}
                onChange={(event) => setAnnouncementSize(event.target.value)}
                placeholder="92"
              />
            </FormField>
          </div>

          <div className="mt-4">
            <CommandButton
              tone="primary"
              disabled={!announcementMessage.trim()}
              onClick={() => {
                onPush({
                  scene: "ANNOUNCEMENT",
                  payload: {
                    message: announcementMessage.trim(),
                    fontSize: Number(announcementSize) || 92,
                  },
                });
                setAnnouncementMessage("");
              }}
            >
              Push Announcement
            </CommandButton>
          </div>
        </div>

        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
          <FormField label="Total Reveal Amount" hint="Manual hero total override">
            <TextInput
              type="number"
              value={totalAmount}
              onChange={(event) => setTotalAmount(event.target.value)}
              placeholder="125000"
            />
          </FormField>
          <div className="mt-4">
            <CommandButton
              tone="primary"
              disabled={!totalAmount || Number(totalAmount) <= 0}
              onClick={() => {
                onPush({ scene: "TOTAL", payload: { amount: Number(totalAmount) } });
                setTotalAmount("");
              }}
            >
              Push Total Reveal
            </CommandButton>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
