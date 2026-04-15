const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";
const PASSCODE_KEY = "passcode_verified";

export type StoredUser = {
  id?: string;
  email?: string;
  role?: string;
};

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAdminSession(session: { accessToken: string; refreshToken: string; user?: StoredUser }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user ?? {}));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function markDisplayPasscodeVerified() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PASSCODE_KEY, "true");
}

export function isDisplayPasscodeVerified() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PASSCODE_KEY) === "true";
}

export function clearDisplayPasscodeVerification() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PASSCODE_KEY);
}
