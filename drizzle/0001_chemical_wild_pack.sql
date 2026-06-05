ALTER TABLE "User" DROP CONSTRAINT "User_email_unique";--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "emailHash" text;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_emailHash_unique" UNIQUE("emailHash");