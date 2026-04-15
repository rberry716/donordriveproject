import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "./auth.service";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "No token provided" });
    }
    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
    }
    req.user = payload;
    return next();
}

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        return next();
    };
}
