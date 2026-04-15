import { Router } from "express";
import { prisma } from "../db/prisma";
import { loginUser, refreshToken as refreshUserTokens, verifyCode } from "./auth.service";
import { requireAuth } from "./auth.middleware";

const router = Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }
    const result = await loginUser(email, password);
    if (!result) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    await prisma.auditLog.create({
        data: {
            actorId: result.user.id,
            action: "auth.login",
        },
    });
    return res.json(result);
});

router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
    }
    const result = await refreshUserTokens(refreshToken);
    if (!result) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }
    return res.json(result);
});

router.post("/passcode", async (req, res) => {
    const { passcode } = req.body;
    if (!passcode) {
        return res.status(400).json({ error: "Passcode required" });
    }
    const result = await verifyCode(passcode);
    if (!result) {
        return res.status(401).json({ error: "Invalid passcode" });
    }
    return res.status(200).json({ event: result });
});

router.get("/me", requireAuth, (req, res) => {
    return res.json(req.user);
});

export default router;