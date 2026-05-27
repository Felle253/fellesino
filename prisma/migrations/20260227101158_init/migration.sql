-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 1000,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BlackjackGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "betAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "payout" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlackjackGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlackjackCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "suit" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "isFaceDown" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "dealerGameId" TEXT,
    "playerGameId" TEXT,
    CONSTRAINT "BlackjackCard_dealerGameId_fkey" FOREIGN KEY ("dealerGameId") REFERENCES "BlackjackGame" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlackjackCard_playerGameId_fkey" FOREIGN KEY ("playerGameId") REFERENCES "BlackjackGame" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlackjackMove" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "handTotal" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlackjackMove_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "BlackjackGame" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "balanceBefore" REAL NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "description" TEXT,
    "blackjackGameId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_blackjackGameId_fkey" FOREIGN KEY ("blackjackGameId") REFERENCES "BlackjackGame" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_blackjackGameId_key" ON "Transaction"("blackjackGameId");
