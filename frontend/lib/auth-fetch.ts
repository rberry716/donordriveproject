import { getAccessToken, getRefreshToken, setAdminSession, clearAdminSession } from "./auth-storage";

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        setAdminSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return true;
    } catch {
        return false;
    }
}

function refreshOnce(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = attemptRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    const token = getAccessToken();
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type") && init?.body) {
        headers.set("Content-Type", "application/json");
    }

    let res = await fetch(input, { ...init, headers });

    if (res.status === 401) {
        const refreshed = await refreshOnce();
        if (refreshed) {
            const retryHeaders = new Headers(init?.headers);
            retryHeaders.set("Authorization", `Bearer ${getAccessToken()}`);
            if (!retryHeaders.has("Content-Type") && init?.body) {
                retryHeaders.set("Content-Type", "application/json");
            }
            res = await fetch(input, { ...init, headers: retryHeaders });
        }
    }

    return res;
}

export function handleAuthFailure(router: { push: (path: string) => void }) {
    clearAdminSession();
    router.push("/admin");
}
