import { Server } from "socket.io";
import { donorDriveClient } from "../donordrive/donordrive.client";
import { computeRankDiff, RankedEntry, RollingLeaderboardHistory } from "./rank-diff";
import { logger } from "../monitoring/logger";

let io: Server;
let pollInterval: NodeJS.Timeout | null = null;
let previousTeams: RankedEntry[] = [];
let previousParticipants: RankedEntry[] = [];
const teamHistory = new RollingLeaderboardHistory();
const participantHistory = new RollingLeaderboardHistory();

let hourStart: number = Date.now();
let hourlyDonationTotal: number = 0;
let hourlyDonationCount: number = 0;
let lastSeenDonationId: string | number | null = null;
let activeEventId: string | null = null;

export function initPoller(socketServer: Server): void {
    io = socketServer;
}

export function startPolling(eventId: string, intervalMs: number = 15000): void {
    const sameEvent = activeEventId === eventId;

    if (pollInterval) {
        stopPolling();
    }

    if (!sameEvent) {
        hourStart = Date.now();
        hourlyDonationTotal = 0;
        hourlyDonationCount = 0;
        lastSeenDonationId = null;
        previousTeams = [];
        previousParticipants = [];
        activeEventId = eventId;
    }

    pollOnce(eventId);
    pollInterval = setInterval(() => pollOnce(eventId), intervalMs);
    logger.info(`Polling started for event ${eventId} every ${intervalMs}ms`);
}

export function stopPolling(): void {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        logger.info("Polling stopped");
    }
}

export function resetHourlyCounters(): void {
    hourStart = Date.now();
    hourlyDonationTotal = 0;
    hourlyDonationCount = 0;
    logger.info("Hourly counters reset");
}

async function pollOnce(eventId: string): Promise<void> {
    try {
        if (Date.now() - hourStart >= 3600000) {
            resetHourlyCounters();
        }

        const [donations, teams, participants] = await Promise.allSettled([
            donorDriveClient.getDonations(eventId),
            donorDriveClient.getTeams(eventId),
            donorDriveClient.getParticipants(eventId),
        ]);

        if (donations.status === "fulfilled") {
            const donationList = donations.value as any[];

            if (lastSeenDonationId) {
                const lastIndex = donationList.findIndex(
                    (d: any) => String(d.donationID) === String(lastSeenDonationId)
                );
                const newDonations = lastIndex === -1 ? donationList : donationList.slice(0, lastIndex);
                for (const d of newDonations) {
                    hourlyDonationTotal += d.amount ?? 0;
                    hourlyDonationCount++;
                }
            }

            if (donationList.length > 0) {
                lastSeenDonationId = donationList[0].donationID;
            }

            io.to("display").emit("live:donations", donationList);
            io.to("display").emit("live:hourly", {
                total: hourlyDonationTotal,
                count: hourlyDonationCount,
                hourStart,
            });
        } else {
            logger.error(`Error polling donations for event ${eventId}`, { error: donations.reason });
        }

        if (teams.status === "fulfilled") {
            const teamList = teams.value as any[];
            const currentTeams: RankedEntry[] = teamList.map((t: any) => ({
                id: t.teamID,
                name: t.name,
                amount: t.sumDonations,
            }));

            const teamDiff = computeRankDiff(previousTeams, currentTeams);
            teamHistory.push(currentTeams);
            previousTeams = currentTeams;

            io.to("display").emit("live:teams", { rankings: currentTeams, diff: teamDiff });
        } else {
            logger.error(`Error polling teams for event ${eventId}`, { error: teams.reason });
        }

        if (participants.status === "fulfilled") {
            const participantList = participants.value as any[];
            const currentParticipants: RankedEntry[] = participantList.map((p: any) => ({
                id: p.participantID,
                name: p.displayName,
                amount: p.sumDonations,
            }));

            const participantDiff = computeRankDiff(previousParticipants, currentParticipants);
            participantHistory.push(currentParticipants);
            previousParticipants = currentParticipants;

            io.to("display").emit("live:participants", { rankings: currentParticipants, diff: participantDiff });
        } else {
            logger.error(`Error polling participants for event ${eventId}`, { error: participants.reason });
        }
    } catch (error) {
        logger.error(`Unexpected error in pollOnce for event ${eventId}`, { error });
    }
}
