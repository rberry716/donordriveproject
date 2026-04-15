export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatTimestamp(timestamp?: number | string | null) {
  if (!timestamp) return "Awaiting signal";
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatRelativeTime(timestamp?: number | string | null) {
  if (!timestamp) return "No recent events";
  const value = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const deltaMs = Date.now() - value;
  const deltaSec = Math.max(0, Math.round(deltaMs / 1000));

  if (deltaSec < 5) return "Just now";
  if (deltaSec < 60) return `${deltaSec}s ago`;

  const deltaMin = Math.round(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;

  const deltaHr = Math.round(deltaMin / 60);
  return `${deltaHr}h ago`;
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
