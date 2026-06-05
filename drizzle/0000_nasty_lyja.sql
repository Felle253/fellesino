CREATE TYPE "public"."round_status" AS ENUM('IN_PROGRESS', 'WON', 'LOST', 'PUSH');--> statement-breakpoint
CREATE TABLE "BlackjackHand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playerCards" text NOT NULL,
	"dealerCards" text NOT NULL,
	"playerScore" integer NOT NULL,
	"dealerScore" integer NOT NULL,
	"deck" text NOT NULL,
	"lastAction" text,
	"roundId" uuid NOT NULL,
	CONSTRAINT "BlackjackHand_roundId_unique" UNIQUE("roundId")
);
--> statement-breakpoint
CREATE TABLE "GameRound" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "round_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"betAmount" integer NOT NULL,
	"payout" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsed" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"userAgent" text,
	"ipAddress" text,
	"deviceName" text,
	"userId" uuid NOT NULL,
	CONSTRAINT "Session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"passwordHash" text,
	"passwordSalt" text,
	"passwordAlgo" text,
	"passwordVersion" integer DEFAULT 1,
	"coins" integer DEFAULT 1000 NOT NULL,
	"lastActive" timestamp,
	"lastClaimed" timestamp,
	CONSTRAINT "User_username_unique" UNIQUE("username"),
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "BlackjackHand" ADD CONSTRAINT "BlackjackHand_roundId_GameRound_id_fk" FOREIGN KEY ("roundId") REFERENCES "public"."GameRound"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;