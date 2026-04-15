import "dotenv/config";
import { prisma } from "../src/db/prisma";
import { hashPassword } from "../src/auth/auth.service";
import { logger } from "../src/monitoring/logger";

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
        const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD!);
        await prisma.user.create({
            data: {
                email: process.env.ADMIN_EMAIL!,
                passwordHash: hashedPassword,
                role: "ADMIN",
            },
        });
        logger.info("Admin user created");
        logger.warn("Change the admin password after seeding");
    }
    else {
        logger.info("Admin user already exists");
    }
    const display = await prisma.displayState.findFirst();
    if (!display) {
        await prisma.displayState.create({
            data: {
                event: process.env.DEFAULT_EVENT_NAME!,
                slots: [{ type: "pinned", scene: "STANDBY" }],
                layoutTemplate: "FULL_SCREEN",
            }
        });
        logger.info("Display state created");
    }
    else {
        logger.info("Display state already exists");
    }
    const eventPasscode = await prisma.eventPasscode.findFirst();
    if (!eventPasscode) {
        const hashedPasscode = await hashPassword(process.env.DEFAULT_EVENT_PASSCODE!);
        await prisma.eventPasscode.create({
            data: {
                event: process.env.DEFAULT_EVENT_NAME!,
                codeHash: hashedPasscode,
            }
        });
        logger.info("Event passcode created");
    }
    else {
        logger.info("Event passcode already exists");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
