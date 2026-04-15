-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "UpdateJobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "UpdateRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('TOTAL', 'DONATIONS', 'TEAM_LEADERBOARD', 'PARTICIPANT_LEADERBOARD', 'HOURLY_LEADERBOARD', 'HOURLY_TOTAL', 'MILESTONE', 'ANNOUNCEMENT', 'STANDBY');

-- CreateEnum
CREATE TYPE "LayoutTemplate" AS ENUM ('FULL_SCREEN', 'FULL_SCREEN_BAR', 'THREE_COLUMN', 'THREE_COLUMN_BAR', 'MAIN_SIDEBAR', 'MAIN_SIDEBAR_BAR');

-- CreateEnum
CREATE TYPE "ProgressBarType" AS ENUM ('PERIOD_TOTAL', 'DONATION_COUNT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPasscode" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPasscode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayState" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "layoutTemplate" "LayoutTemplate" NOT NULL DEFAULT 'FULL_SCREEN',
    "slots" JSONB NOT NULL DEFAULT '[]',
    "progressBarType" "ProgressBarType",
    "progressBarGoal" DOUBLE PRECISION,
    "progressBarStartTime" TIMESTAMP(3),
    "progressBarEndTime" TIMESTAMP(3),
    "activeOverride" "SceneType",
    "overridePayload" JSONB,
    "activeCampaignId" TEXT,
    "autoCycleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoCycleIntervalSec" INTEGER NOT NULL DEFAULT 30,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "showDonorNames" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateJob" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sheetUrl" TEXT NOT NULL,
    "tabName" TEXT NOT NULL DEFAULT 'Sheet1',
    "intervalSec" INTEGER NOT NULL DEFAULT 300,
    "status" "UpdateJobStatus" NOT NULL DEFAULT 'PAUSED',
    "pausedAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpdateJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateFieldMapping" (
    "id" TEXT NOT NULL,
    "updateJobId" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "targetColumn" TEXT NOT NULL,
    "transformRule" TEXT,

    CONSTRAINT "UpdateFieldMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateCheckpoint" (
    "id" TEXT NOT NULL,
    "updateJobId" TEXT NOT NULL,
    "watermark" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpdateCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateRun" (
    "id" TEXT NOT NULL,
    "updateJobId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "UpdateRunStatus" NOT NULL DEFAULT 'RUNNING',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,

    CONSTRAINT "UpdateRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateCheckpoint_updateJobId_key" ON "UpdateCheckpoint"("updateJobId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricName_recordedAt_idx" ON "PerformanceMetric"("metricName", "recordedAt");

-- AddForeignKey
ALTER TABLE "UpdateFieldMapping" ADD CONSTRAINT "UpdateFieldMapping_updateJobId_fkey" FOREIGN KEY ("updateJobId") REFERENCES "UpdateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateCheckpoint" ADD CONSTRAINT "UpdateCheckpoint_updateJobId_fkey" FOREIGN KEY ("updateJobId") REFERENCES "UpdateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRun" ADD CONSTRAINT "UpdateRun_updateJobId_fkey" FOREIGN KEY ("updateJobId") REFERENCES "UpdateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
