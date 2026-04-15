import { io, Socket } from "socket.io-client";
import { readLastSeq, saveLastSeq } from "./display-snapshot";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function resolveSocketUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
    || process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
    || "";

  if (typeof window === "undefined") {
    return explicit || "http://localhost:4000";
  }

  const current = new URL(window.location.origin);

  const normalize = (value: string): string | null => {
    try {
      const url = new URL(value, window.location.origin);

      if (LOOPBACK_HOSTS.has(url.hostname) && !LOOPBACK_HOSTS.has(current.hostname)) {
        url.hostname = current.hostname;
      }

      return url.origin;
    } catch {
      return null;
    }
  };

  const normalizedExplicit = explicit ? normalize(explicit) : null;
  if (normalizedExplicit) {
    return normalizedExplicit;
  }

  const fallback = new URL(window.location.origin);
  fallback.port = "4000";
  return fallback.origin;
}

let displaySocket: Socket | null = null;
let adminSocket: Socket | null = null;
let displaySocketUrl: string | null = null;
let adminSocketUrl: string | null = null;
let displayLastSeq = readLastSeq();

export function readDisplaySeq() {
  return displayLastSeq;
}

export function updateDisplaySeq(seq: number) {
  if (seq > displayLastSeq) {
    displayLastSeq = seq;
    saveLastSeq(seq);
  }
}

export function connectDisplay(): Socket {
  const socketUrl = resolveSocketUrl();

  if (displaySocket) {
    if (displaySocketUrl !== socketUrl) {
      displaySocket.disconnect();
      displaySocket = null;
      displaySocketUrl = null;
    } else {
      if (!displaySocket.connected) displaySocket.connect();
      return displaySocket;
    }
  }

  displaySocket = io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  displaySocketUrl = socketUrl;

  displaySocket.on("connect", () => {
    displaySocket?.emit("join:display");
    if (displayLastSeq > 0) {
      displaySocket?.emit("display:ack", displayLastSeq);
    }
  });

  displaySocket.connect();
  return displaySocket;
}

export function connectAdmin(token: string): Socket {
  const socketUrl = resolveSocketUrl();

  if (adminSocket) {
    adminSocket.auth = { token };
    if (adminSocketUrl !== socketUrl) {
      adminSocket.disconnect();
      adminSocket = null;
      adminSocketUrl = null;
    } else {
      if (!adminSocket.connected) adminSocket.connect();
      return adminSocket;
    }
  }

  adminSocket = io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: { token },
  });
  adminSocketUrl = socketUrl;

  adminSocket.on("connect", () => {
    adminSocket?.emit("join:admin");
  });

  adminSocket.connect();
  return adminSocket;
}

export function disconnectDisplaySocket() {
  if (displaySocket) {
    displaySocket.disconnect();
    displaySocket = null;
    displaySocketUrl = null;
  }
}

export function disconnectAdminSocket() {
  if (adminSocket) {
    adminSocket.disconnect();
    adminSocket = null;
    adminSocketUrl = null;
  }
}
