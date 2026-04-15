import winston from "winston";

const SENSITIVE_PATTERN = /password|hash|token|secret|code|key/i;
const REDACTED = "[REDACTED]";

function redactValue(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(redactValue);
  if (typeof obj === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      clean[k] = SENSITIVE_PATTERN.test(k) ? REDACTED : redactValue(v);
    }
    return clean;
  }
  return obj;
}

const redactFormat = winston.format((info) => {
  if (info.metadata && typeof info.metadata === "object") {
    info.metadata = redactValue(info.metadata);
  }
  return info;
});

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
    redactFormat()
  ),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, metadata }) => {
              const meta =
                metadata && Object.keys(metadata).length
                  ? ` ${JSON.stringify(metadata)}`
                  : "";
              return `${timestamp} ${level}: ${message}${meta}`;
            })
          ),
    }),
  ],
});
