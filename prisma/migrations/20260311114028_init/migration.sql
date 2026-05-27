/*
  Warnings:

  - You are about to drop the `BlackjackCard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlackjackGame` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlackjackMove` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_blackjackGameId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BlackjackCard";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BlackjackGame";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BlackjackMove";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceName" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "betAmount" INTEGER NOT NULL,
    "payout" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "GameRound_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlackjackHand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerCards" TEXT NOT NULL,
    "dealerCards" TEXT NOT NULL,
    "playerScore" INTEGER NOT NULL,
    "dealerScore" INTEGER NOT NULL,
    "lastAction" TEXT,
    "roundId" TEXT NOT NULL,
    CONSTRAINT "BlackjackHand_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "GameRound" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT,
    "passwordSalt" TEXT,
    "passwordAlgo" TEXT,
    "passwordVersion" INTEGER DEFAULT 1,
    "coins" INTEGER NOT NULL DEFAULT 1000,
    "lastActive" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "id", "passwordHash", "username") SELECT "createdAt", "email", "id", "passwordHash", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BlackjackHand_roundId_key" ON "BlackjackHand"("roundId");
