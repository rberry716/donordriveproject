import { prisma } from "../db/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { logger } from "../monitoring/logger";

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
}

export type TokenPayload = {
    userId: string;
    role: string;
};

type LoginResult = {
    user: { id: string; email: string; role: string };
    accessToken: string;
    refreshToken: string;
};

export function issueTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME! as any});
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME! as any });
    return { accessToken, refreshToken };
}

export async function loginUser(email: string, password: string): Promise<LoginResult | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        logger.info("Login failed: user not found", { email });
        return null;
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
        logger.info("Login failed: invalid password", { email });
        return null;
    }
    const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role });
    return {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
    };
}

export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        return payload;
    } catch (error) {
        logger.info("Invalid access token", { error });
        return null;
    }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
    try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
        return payload;
    } catch (error) {
        logger.info("Invalid refresh token", { error });
        return null;
    }
}

export async function refreshToken(token: string) {
    try {
        const payload = verifyRefreshToken(token);
        if (!payload) {
            return null;
        }
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            logger.info("User not found", { userId: payload.userId });
            return null;
        }
        const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role });
        return { accessToken, refreshToken };
    }
    catch (error) {
        logger.info("Error refreshing token", { error });
        return null;
    }
}

export async function verifyCode(code: string): Promise<string | null> {
    try {
        const passcodes = await prisma.eventPasscode.findMany({
            where: {
                active: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });
        for (const passcode of passcodes) {
            const match = await argon2.verify(passcode.codeHash, code);
            if (match) return passcode.event;
        }
        return null;
    } catch (error) {
        logger.info("Error verifying code", { error });
        return null;
    }
}
