"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DisplayState, DisplayStatusResponse, PersistentOverride } from "@/types/display";
import {
  clearDisplayOverride,
  fetchDisplayState,
  fetchDisplayStatus,
  patchDisplayState,
  pushDisplayOverride,
  toggleDisplayFreeze,
} from "@/lib/display-api";
import { clearAdminSession, getAccessToken } from "@/lib/auth-storage";

type AdminState = {
  state: DisplayState | null;
  status: DisplayStatusResponse;
  loading: boolean;
  saving: boolean;
  error: string;
};

const EMPTY_STATUS: DisplayStatusResponse = {
  connectedCount: 0,
  lastEvent: null,
};

export function useDisplayAdminState() {
  const router = useRouter();
  const [adminState, setAdminState] = useState<AdminState>({
    state: null,
    status: EMPTY_STATUS,
    loading: true,
    saving: false,
    error: "",
  });

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    router.replace("/admin");
  }, [router]);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      handleUnauthorized();
      return;
    }

    try {
      const [state, status] = await Promise.all([fetchDisplayState(), fetchDisplayStatus()]);
      setAdminState({
        state,
        status,
        loading: false,
        saving: false,
        error: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load display state";
      if (/unauthorized|forbidden|401/i.test(message)) {
        handleUnauthorized();
        return;
      }
      setAdminState((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!getAccessToken()) return;
    const interval = window.setInterval(async () => {
      try {
        const status = await fetchDisplayStatus();
        setAdminState((current) => ({ ...current, status }));
      } catch {
        // Keep the last known telemetry rather than jittering the UI on poll failures.
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const runMutation = useCallback(
    async (operation: () => Promise<DisplayState>) => {
      setAdminState((current) => ({ ...current, saving: true, error: "" }));
      try {
        const nextState = await operation();
        const status = await fetchDisplayStatus().catch(() => adminState.status);
        setAdminState((current) => ({
          ...current,
          state: nextState,
          status,
          saving: false,
          error: "",
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Request failed";
        if (/unauthorized|forbidden|401/i.test(message)) {
          handleUnauthorized();
          return;
        }
        setAdminState((current) => ({
          ...current,
          saving: false,
          error: message,
        }));
      }
    },
    [adminState.status, handleUnauthorized],
  );

  const actions = useMemo(
    () => ({
      refresh: load,
      updateState: (updates: Partial<DisplayState>) => runMutation(() => patchDisplayState(updates)),
      setOverride: (override: NonNullable<PersistentOverride>) => runMutation(() => pushDisplayOverride(override)),
      clearOverride: () => runMutation(() => clearDisplayOverride()),
      toggleFreeze: () => runMutation(() => toggleDisplayFreeze()),
      sendStandby: () =>
        runMutation(() =>
          patchDisplayState({
            layoutTemplate: "FULL_SCREEN",
            slots: [{ type: "pinned", scene: "STANDBY" }],
          }),
        ),
    }),
    [load, runMutation],
  );

  return {
    ...adminState,
    ...actions,
  };
}
