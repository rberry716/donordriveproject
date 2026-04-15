import { Server } from "socket.io";
import { logger } from "../monitoring/logger";
import { startPolling, stopPolling } from "./display.poller";
import { prisma } from "../db/prisma";

type ReplayEvent = {
    seq: number;
    event: string;
    payload: any;
    timestamp: number;
};

const BUFFER_MAX = 20;
let seq = 0;
const replayBuffer: ReplayEvent[] = [];
let io: Server;

async function emitCurrentDisplayState(socket: { emit: (event: string, payload: any) => void }): Promise<void> {
    const displayState = await prisma.displayState.findFirst();
    if (!displayState) {
        logger.warn("No display state found while bootstrapping display client");
        return;
    }

    socket.emit("director:scene", {
        scene: "LAYOUT_UPDATE",
        ...displayState,
    });

    if (displayState.activeOverride) {
        socket.emit("director:scene", {
            scene: displayState.activeOverride,
            ...(displayState.overridePayload && typeof displayState.overridePayload === "object" ? displayState.overridePayload : {}),
        });
    }

    if (displayState.frozen) {
        socket.emit("director:freeze", { frozen: true });
    }
}

export function initDisplayHub(socketServer: Server): void {
    io = socketServer;

    io.on("connection", (socket) => {
        socket.on("join:display", async () => {
            socket.join("display");
            logger.info(`Display client connected: ${socket.id}`);

            const displayCount = io.sockets.adapter.rooms.get("display")?.size ?? 0;
            if (displayCount === 1) {
                startPolling(process.env.DEFAULT_EVENT_ID || "6777");
            }

            try {
                await emitCurrentDisplayState(socket);
            } catch (error) {
                logger.error(`Failed to bootstrap display client ${socket.id}`, { error });
            }

            socket.on("display:ack", (lastSeq: number) => {
                const missed = replayBuffer.filter((e) => e.seq > lastSeq);
                if (missed.length > 0) {
                    socket.emit("director:replay", missed);
                    logger.info(`Replayed ${missed.length} events to ${socket.id} since seq ${lastSeq}`);
                }
            });
        });

        socket.on("join:admin", () => {
            socket.join("admin");
            logger.info(`Admin client connected: ${socket.id}`);
        });

        socket.on("disconnect", () => {
            const displayCount = io.sockets.adapter.rooms.get("display")?.size ?? 0;
            if (displayCount === 0) {
                stopPolling();
            }
        });
    });
}

export function pushScene(scene: string, payload?: any): void {
    seq++;
    const entry: ReplayEvent = {
        seq,
        event: "director:scene",
        payload: { scene, ...payload },
        timestamp: Date.now(),
    };
    replayBuffer.push(entry);
    if (replayBuffer.length > BUFFER_MAX) {
        replayBuffer.shift();
    }
    io.to("display").emit("director:scene", entry.payload);
    logger.info(`Pushed scene: ${scene}`, { seq });
}

export function pushFreeze(frozen: boolean): void {
    io.to("display").emit("director:freeze", { frozen });
    logger.info(`Pushed freeze: ${frozen}`);
}

export function getConnectedDisplayCount(): number {
    return io.sockets.adapter.rooms.get("display")?.size ?? 0;
}

export function getLastEvent(): ReplayEvent | null {
    return replayBuffer.length > 0 ? replayBuffer[replayBuffer.length - 1] : null;
}
