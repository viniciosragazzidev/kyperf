CREATE TYPE "public"."work_status" AS ENUM('AVAILABLE', 'BUSY', 'AWAY');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "specialties" text[];--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "work_status" "work_status" DEFAULT 'AVAILABLE' NOT NULL;