"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DisplayState } from "@/types/display";

function slotSignature(slot: DisplayState["slots"][number]) {
  return slot.type === "pinned" ? `pinned:${slot.scene}` : `rotating:${slot.scenes.join("|")}`;
}

export function useSlotRotation(options: {
  layout: Pick<DisplayState, "layoutTemplate" | "slots" | "autoCycleEnabled" | "autoCycleIntervalSec">;
  allowRotation: boolean;
  initialRotation?: Record<number, number>;
}) {
  const { layout, allowRotation, initialRotation } = options;
  const [rotation, setRotation] = useState<Record<number, number>>(initialRotation ?? {});
  const previousSignatures = useRef<string[]>(layout.slots.map(slotSignature));
  const previousTemplate = useRef(layout.layoutTemplate);

  const signatures = useMemo(() => layout.slots.map(slotSignature), [layout.slots]);

  useEffect(() => {
    const resetNeeded = previousTemplate.current !== layout.layoutTemplate;
    const nextRotation: Record<number, number> = { ...rotation };
    let changed = resetNeeded;

    signatures.forEach((signature, index) => {
      if (resetNeeded || previousSignatures.current[index] !== signature) {
        nextRotation[index] = 0;
        changed = true;
      }
    });

    if (changed) {
      setRotation(nextRotation);
    }

    previousSignatures.current = signatures;
    previousTemplate.current = layout.layoutTemplate;
  }, [layout.layoutTemplate, rotation, signatures]);

  useEffect(() => {
    if (!allowRotation || !layout.autoCycleEnabled) return;
    if (!layout.slots.some((slot) => slot.type === "rotating")) return;

    const interval = window.setInterval(() => {
      setRotation((current) => {
        const next = { ...current };
        layout.slots.forEach((slot, index) => {
          if (slot.type === "rotating" && slot.scenes.length > 0) {
            next[index] = ((current[index] ?? 0) + 1) % slot.scenes.length;
          }
        });
        return next;
      });
    }, layout.autoCycleIntervalSec * 1000);

    return () => window.clearInterval(interval);
  }, [allowRotation, layout.autoCycleEnabled, layout.autoCycleIntervalSec, layout.slots]);

  return {
    rotation,
    setRotation,
  };
}
