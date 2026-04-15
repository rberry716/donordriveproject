import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import { logger } from "./monitoring/logger";
import { prisma } from "./db/prisma";
import authRouter from "./auth/auth.router";
import displayRouter from "./display/display.router";
import { initDisplayHub } from "./display/display.hub";
import { initPoller } from "./display/display.poller";

const app = express();
const server = createServer(app);

const configuredFrontendOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

function isLocalNetworkHost(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(lower)) {
        return true;
    }
    if (/^10\.\d+\.\d+\.\d+$/.test(lower)) {
        return true;
    }
    if (/^192\.168\.\d+\.\d+$/.test(lower)) {
        return true;
    }

    const privateRangeMatch = lower.match(/^172\.(\d+)\.\d+\.\d+$/);
    if (!privateRangeMatch) {
        return false;
    }

    const secondOctet = Number(privateRangeMatch[1]);
    return secondOctet >= 16 && secondOctet <= 31;
}

function isAllowedFrontendOrigin(origin?: string): boolean {
    if (!origin || configuredFrontendOrigins.length === 0) {
        return true;
    }

    try {
        const incoming = new URL(origin);

        return configuredFrontendOrigins.some((allowedOrigin) => {
            const allowed = new URL(allowedOrigin);

            if (allowed.origin === incoming.origin) {
                return true;
            }

            return (
                isLocalNetworkHost(allowed.hostname)
                && isLocalNetworkHost(incoming.hostname)
                && allowed.protocol === incoming.protocol
                && allowed.port === incoming.port
            );
        });
    } catch {
        return false;
    }
}

const corsOrigin = (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    callback(null, isAllowedFrontendOrigin(origin));
};

const io = new Server(server, { cors: { origin: corsOrigin } });

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/display", displayRouter);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/ready", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ready" });
    } catch {
        res.status(503).json({ status: "not ready" });
    }
});

initDisplayHub(io);
initPoller(io);

const PORT = parseInt(process.env.PORT || "4000", 10);
server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

export default io;
