import { publicApiBucket, restfulApiBucket } from "./token-bucket";
import { logger } from "../monitoring/logger";

const useMock = process.env.USE_MOCK === "true";
const mockServerUrl = process.env.MOCK_SERVER_URL || "http://localhost:4001";
const PUBLIC_API_BASE_URL = useMock
  ? mockServerUrl
  : process.env.DONORDRIVE_PUBLIC_API_BASE_URL || "https://events.dancemarathon.com";
const RESTFUL_API_BASE_URL = useMock
  ? mockServerUrl
  : process.env.DONORDRIVE_RESTFUL_API_BASE_URL || "https://api.donordrive.com";

const etagCache = new Map<string, { etag: string; data: any }>();

async function publicApiFetch<T>(path: string): Promise<T> {
    await publicApiBucket.acquire();
    const cached = etagCache.get(path);
    const headers: Record<string, string> = {};
    if (cached) {
        headers["if-none-match"] = cached.etag;
    }
    const res = await fetch(`${PUBLIC_API_BASE_URL}${path}`, { headers });
    if (res.status === 304 && cached) {
        return cached.data as T;
    }
    if (!res.ok) {
        logger.error(`Error - Public API ${path} - ${res.status} ${res.statusText}`);
        throw new Error(`Public API ${path} - ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const etag = res.headers.get("etag");
    if (etag) {
        etagCache.set(path, { etag, data });
    }
    return data as T;
}

async function restfulApiFetch<T>(path: string): Promise<T> {
    await restfulApiBucket.acquire();
    const credentials = Buffer.from(`${process.env.DONORDRIVE_EMAIL}:${process.env.DONORDRIVE_PASSWORD}`).toString("base64");
    const headers: Record<string, string> = {
        "Authorization": `Basic ${credentials}`,
    };
    const res = await fetch(`${RESTFUL_API_BASE_URL}${path}`, { headers });
    if (!res.ok) {
        logger.error(`Error - Restful API ${path} - ${res.status} ${res.statusText}`);
        throw new Error(`Restful API ${path} - ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data as T;
}

export const donorDriveClient = {
    getCampaign: (eventId: string) =>
        publicApiFetch<any>(`/api/events/${eventId}`),

    getDonations: (eventId: string, limit?: number) =>
        publicApiFetch<any>(`/api/events/${eventId}/donations${limit ? `?limit=${limit}` : ""}`),

    getTeams: (eventId: string) =>
        useMock
            ? publicApiFetch<any>(`/api/events/${eventId}/teams`)
            : restfulApiFetch<any>(`/v2/${process.env.DONORDRIVE_CLIENT_KEY}/event/${eventId}/team?orderBy=sumDonations DESC`),

    getParticipants: (eventId: string) =>
        useMock
            ? publicApiFetch<any>(`/api/events/${eventId}/participants`)
            : restfulApiFetch<any>(`/v2/${process.env.DONORDRIVE_CLIENT_KEY}/event/${eventId}/participant?orderBy=sumDonations DESC`),

    getBucketStatus: () => ({
        publicApi: publicApiBucket.getStatus(),
        restfulApi: restfulApiBucket.getStatus(),
    }),
};