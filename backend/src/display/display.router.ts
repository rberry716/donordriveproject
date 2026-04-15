import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { prisma } from "../db/prisma";
import { pushScene, pushFreeze, getConnectedDisplayCount, getLastEvent } from "./display.hub";
import { LayoutTemplate } from "@prisma/client";
import { Prisma } from "@prisma/client";
const router = Router();
router.use(requireAuth);

const slotCounts: Record<LayoutTemplate, number> = {
  FULL_SCREEN: 1,
  FULL_SCREEN_BAR: 1,
  THREE_COLUMN: 3,
  THREE_COLUMN_BAR: 3,
  MAIN_SIDEBAR: 2,
  MAIN_SIDEBAR_BAR: 2,
};

router.get("/state", async (req, res) => {
  const displayState = await prisma.displayState.findFirst();
  if (!displayState) {
    return res.status(404).json({ error: "Display state not found" });
  }
  return res.json(displayState);
});

router.patch("/state", async (req, res) => {
  const {
    layoutTemplate, slots, progressBarType, progressBarGoal,
    progressBarStartTime, progressBarEndTime, activeCampaignId,
    autoCycleEnabled, autoCycleIntervalSec, showDonorNames,
  } = req.body;

  const displayState = await prisma.displayState.findFirst();
  if (!displayState) {
    return res.status(404).json({ error: "Display state not found" });
  }

  const template = layoutTemplate || displayState.layoutTemplate;

  if (slots) {
    if (slots.length !== slotCounts[template as LayoutTemplate]) {
      return res.status(400).json({ error: `${template} requires ${slotCounts[template as LayoutTemplate]} slots` });
    }
  }

  const templateHasBar = template.endsWith("_BAR");
  const includesProgressBarFields =
    progressBarType !== undefined
    || progressBarGoal !== undefined
    || progressBarStartTime !== undefined
    || progressBarEndTime !== undefined;

  const data: Record<string, any> = {};
  if (layoutTemplate !== undefined) data.layoutTemplate = layoutTemplate;
  if (slots !== undefined) data.slots = slots;
  if (templateHasBar) {
    if (progressBarType !== undefined) data.progressBarType = progressBarType;
    if (progressBarGoal !== undefined) data.progressBarGoal = progressBarGoal;
    if (progressBarStartTime !== undefined) data.progressBarStartTime = progressBarStartTime;
    if (progressBarEndTime !== undefined) data.progressBarEndTime = progressBarEndTime;
  } else if (includesProgressBarFields || layoutTemplate !== undefined) {
    data.progressBarType = null;
    data.progressBarGoal = null;
    data.progressBarStartTime = null;
    data.progressBarEndTime = null;
  }
  if (activeCampaignId !== undefined) data.activeCampaignId = activeCampaignId;
  if (autoCycleEnabled !== undefined) data.autoCycleEnabled = autoCycleEnabled;
  if (autoCycleIntervalSec !== undefined) data.autoCycleIntervalSec = autoCycleIntervalSec;
  if (showDonorNames !== undefined) data.showDonorNames = showDonorNames;

  const updatedDisplayState = await prisma.displayState.update({
    where: { id: displayState.id },
    data,
  });

  pushScene("LAYOUT_UPDATE", updatedDisplayState);
  return res.json(updatedDisplayState);
});

router.post("/override", async (req, res) => {
  const { scene, payload } = req.body;
  const displayState = await prisma.displayState.findFirst();
  if (!displayState) {
    return res.status(404).json({ error: "Display state not found" });
  }
  if (scene !== "MILESTONE" && scene !== "ANNOUNCEMENT" && scene !== "TOTAL") {
    return res.status(400).json({ error: "Invalid override scene type" });
  }

  const updatedDisplayState = await prisma.displayState.update({
    where: { id: displayState.id },
    data: { activeOverride: scene, overridePayload: payload },
  });

  pushScene(scene, payload);
  return res.status(200).json(updatedDisplayState);
});

router.delete("/override", async (req, res) => {
  const displayState = await prisma.displayState.findFirst();
  if (!displayState) {
    return res.status(404).json({ error: "Display state not found" });
  }

  const updatedDisplayState = await prisma.displayState.update({
    where: { id: displayState.id },
    data: { activeOverride: null, overridePayload: Prisma.DbNull },
  });

  pushScene("OVERRIDE_CLEAR");
  return res.status(200).json(updatedDisplayState);
});

router.post("/freeze", async (req, res) => {
  const displayState = await prisma.displayState.findFirst();
  if (!displayState) {
    return res.status(404).json({ error: "Display state not found" });
  }

  const updatedDisplayState = await prisma.displayState.update({
    where: { id: displayState.id },
    data: { frozen: !displayState.frozen },
  });

  pushFreeze(!displayState.frozen);
  return res.status(200).json(updatedDisplayState);
});

router.get("/status", (req, res) => {
  return res.json({
    connectedCount: getConnectedDisplayCount(),
    lastEvent: getLastEvent(),
  });
});

export default router;
