import type { DisplayState, DisplayStatusResponse, PersistentOverride } from "@/types/display";
import { getAccessToken } from "./auth-storage";

function authHeaders() {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function sanitizeDisplayStatePatch(updates: Partial<DisplayState>): Partial<DisplayState> {
  if (!updates.layoutTemplate || updates.layoutTemplate.endsWith("_BAR")) {
    return updates;
  }

  return {
    ...updates,
    progressBarType: null,
    progressBarGoal: null,
    progressBarStartTime: null,
    progressBarEndTime: null,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data?.error || data?.message || "Request failed";
    throw new Error(error);
  }
  return data as T;
}

export async function fetchDisplayState() {
  const response = await fetch("/api/display/state", {
    headers: authHeaders(),
    cache: "no-store",
  });
  return parseResponse<DisplayState>(response);
}

export async function patchDisplayState(updates: Partial<DisplayState>) {
  const response = await fetch("/api/display/state", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(sanitizeDisplayStatePatch(updates)),
  });
  return parseResponse<DisplayState>(response);
}

export async function pushDisplayOverride(override: NonNullable<PersistentOverride>) {
  const response = await fetch("/api/display/override", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      scene: override.scene,
      payload: override.payload ?? {},
    }),
  });
  return parseResponse<DisplayState>(response);
}

export async function clearDisplayOverride() {
  const response = await fetch("/api/display/override", {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseResponse<DisplayState>(response);
}

export async function toggleDisplayFreeze() {
  const response = await fetch("/api/display/freeze", {
    method: "POST",
    headers: authHeaders(),
  });
  return parseResponse<DisplayState>(response);
}

export async function fetchDisplayStatus() {
  const response = await fetch("/api/display/status", {
    headers: authHeaders(),
    cache: "no-store",
  });
  return parseResponse<DisplayStatusResponse>(response);
}
