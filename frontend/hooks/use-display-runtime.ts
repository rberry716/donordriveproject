"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DisplayState, ConnectionState, PersistentOverride } from "@/types/display";
import type { LiveDataState } from "@/types/live";
import type { DirectorReplayEvent, DirectorScenePayload } from "@/types/socket";
import { connectDisplay, disconnectDisplaySocket, readDisplaySeq, updateDisplaySeq } from "@/lib/socket";
import { readDisplaySnapshot, readLastSeq, writeDisplaySnapshot } from "@/lib/display-snapshot";
import { useSlotRotation } from "./use-slot-rotation";

const DEFAULT_LAYOUT: DisplayState = {
  layoutTemplate: "FULL_SCREEN",
  slots: [{ type: "pinned", scene: "STANDBY" }],
  progressBarType: null,
  progressBarGoal: null,
  progressBarStartTime: null,
  progressBarEndTime: null,
  activeOverride: null,
  overridePayload: null,
  autoCycleEnabled: false,
  autoCycleIntervalSec: 30,
  showDonorNames: true,
  frozen: false,
};

const EMPTY_LIVE_STATE: LiveDataState = {
  donations: [],
  teams: null,
  participants: null,
  hourly: null,
  campaign: null,
};

type RuntimeState = {
  layout: DisplayState;
  override: PersistentOverride;
  live: LiveDataState;
  frozen: boolean;
  awaitingDirectorSync: boolean;
};

function toRuntimeLayout(input: Partial<DisplayState>): DisplayState {
  return {
    ...DEFAULT_LAYOUT,
    ...input,
    slots: input.slots ?? DEFAULT_LAYOUT.slots,
  };
}

function deriveOverrideFromScene(payload: DirectorScenePayload): PersistentOverride {
  if (payload.scene === "TOTAL" || payload.scene === "ANNOUNCEMENT" || payload.scene === "MILESTONE") {
    const { scene, ...rest } = payload;
    return {
      scene,
      payload: rest,
    };
  }
  return null;
}

function applyDirectorPayload(current: RuntimeState, payload: DirectorScenePayload): RuntimeState {
  if (payload.scene === "LAYOUT_UPDATE") {
    return {
      ...current,
      layout: toRuntimeLayout({
        ...current.layout,
        ...payload,
      }),
      override: null,
      awaitingDirectorSync: false,
    };
  }

  if (payload.scene === "OVERRIDE_CLEAR") {
    return {
      ...current,
      override: null,
      awaitingDirectorSync: false,
    };
  }

  return {
    ...current,
    override: deriveOverrideFromScene(payload),
    awaitingDirectorSync: false,
  };
}

export function useDisplayRuntime() {
  const snapshot = useMemo(() => readDisplaySnapshot(), []);
  const initialRuntime = useMemo<RuntimeState>(
    () => ({
      layout: toRuntimeLayout(snapshot?.layout ?? {}),
      override: snapshot?.override ?? null,
      live: {
        ...EMPTY_LIVE_STATE,
        teams: snapshot?.leaderboard.teams ?? null,
        participants: snapshot?.leaderboard.participants ?? null,
        hourly: snapshot?.hourly ?? null,
      },
      frozen: snapshot?.layout.frozen ?? false,
      awaitingDirectorSync: !snapshot,
    }),
    [snapshot],
  );

  const [canonicalState, setCanonicalState] = useState<RuntimeState>(initialRuntime);
  const [frozenFrame, setFrozenFrame] = useState<RuntimeState | null>(snapshot ? initialRuntime : null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(snapshot ? "booting" : "booting");
  const lastSeqRef = useRef(readDisplaySeq() || readLastSeq());
  const canonicalRef = useRef(initialRuntime);
  const rotationRef = useRef<Record<number, number>>(snapshot?.rotation ?? {});
  const offlineTimerRef = useRef<number | null>(null);

  const {
    rotation,
    setRotation,
  } = useSlotRotation({
    layout: canonicalState.layout,
    allowRotation:
      connectionState === "live" &&
      !canonicalState.frozen &&
      !canonicalState.override,
    initialRotation: snapshot?.rotation,
  });

  const visibleState = canonicalState.frozen && frozenFrame ? frozenFrame : canonicalState;

  const persistSnapshot = useCallback(
    (state: RuntimeState) => {
      writeDisplaySnapshot({
        layout: {
          layoutTemplate: state.layout.layoutTemplate,
          slots: state.layout.slots,
          progressBarType: state.layout.progressBarType,
          progressBarGoal: state.layout.progressBarGoal,
          progressBarStartTime: state.layout.progressBarStartTime,
          progressBarEndTime: state.layout.progressBarEndTime,
          autoCycleEnabled: state.layout.autoCycleEnabled,
          autoCycleIntervalSec: state.layout.autoCycleIntervalSec,
          showDonorNames: state.layout.showDonorNames,
          frozen: state.frozen,
        },
        override: state.override,
        rotation: rotationRef.current,
        live: state.live,
        lastSeq: lastSeqRef.current,
      });
    },
    [],
  );

  const updateCanonical = useCallback(
    (updater: (current: RuntimeState) => RuntimeState) => {
      setCanonicalState((current) => {
        const next = updater(current);
        canonicalRef.current = next;
        if (!next.frozen) {
          setFrozenFrame(null);
        }
        persistSnapshot(next);
        return next;
      });
    },
    [persistSnapshot],
  );

  useEffect(() => {
    rotationRef.current = rotation;
    persistSnapshot(canonicalState);
  }, [canonicalState, persistSnapshot, rotation]);

  useEffect(() => {
    const socket = connectDisplay();

    const setOfflineTimer = () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
      offlineTimerRef.current = window.setTimeout(() => {
        setConnectionState("offline");
      }, 8000);
    };

    socket.on("connect", () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
      setConnectionState("live");
    });

    socket.on("disconnect", () => {
      setConnectionState("reconnecting");
      setOfflineTimer();
      persistSnapshot(canonicalRef.current);
    });

    socket.on("director:scene", (payload: DirectorScenePayload) => {
      updateCanonical((current) => applyDirectorPayload(current, payload));
    });

    socket.on("director:replay", (events: DirectorReplayEvent[]) => {
      updateCanonical((current) => events.reduce((state, event) => applyDirectorPayload(state, event.payload), current));
      const last = events.at(-1);
      if (last) {
        lastSeqRef.current = last.seq;
        updateDisplaySeq(last.seq);
      }
    });

    socket.on("director:freeze", ({ frozen }: { frozen: boolean }) => {
      setCanonicalState((current) => {
        const next = { ...current, frozen, layout: { ...current.layout, frozen } };
        canonicalRef.current = next;
        if (frozen) {
          setFrozenFrame(current);
        } else {
          setFrozenFrame(null);
        }
        persistSnapshot(next);
        return next;
      });
    });

    socket.on("live:donations", (data) => {
      updateCanonical((current) => ({
        ...current,
        live: { ...current.live, donations: data },
      }));
    });

    socket.on("live:teams", (data) => {
      updateCanonical((current) => ({
        ...current,
        live: { ...current.live, teams: data },
      }));
    });

    socket.on("live:participants", (data) => {
      updateCanonical((current) => ({
        ...current,
        live: { ...current.live, participants: data },
      }));
    });

    socket.on("live:hourly", (data) => {
      updateCanonical((current) => ({
        ...current,
        live: { ...current.live, hourly: data },
      }));
    });

    socket.on("live:campaign", (data) => {
      updateCanonical((current) => ({
        ...current,
        live: { ...current.live, campaign: data },
      }));
    });

    return () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
      disconnectDisplaySocket();
    };
  }, [persistSnapshot, updateCanonical]);

  useEffect(() => {
    if (canonicalState.awaitingDirectorSync) return;
    persistSnapshot(canonicalState);
  }, [canonicalState, persistSnapshot]);

  return {
    layout: visibleState.layout,
    canonicalLayout: canonicalState.layout,
    liveData: visibleState.live,
    canonicalLiveData: canonicalState.live,
    override: visibleState.override,
    frozen: visibleState.frozen,
    connectionState,
    hasSnapshot: !!snapshot,
    awaitingDirectorSync: visibleState.awaitingDirectorSync,
    rotation,
    setRotation,
  };
}
