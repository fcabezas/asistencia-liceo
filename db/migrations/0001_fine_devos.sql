CREATE TYPE "public"."day_group" AS ENUM('lunes_jueves', 'viernes');--> statement-breakpoint
CREATE TABLE "bell_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_group" "day_group" NOT NULL,
	"block_number" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bell_schedule_unique" ON "bell_schedule" USING btree ("day_group","block_number");