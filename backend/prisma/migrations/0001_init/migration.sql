-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR');

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
