ALTER TYPE "public"."user_role" ADD VALUE 'pie';--> statement-breakpoint
CREATE TABLE "substitute_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"block_number" integer NOT NULL,
	"date" date NOT NULL,
	"substitute_teacher_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "substitute_assignments" ADD CONSTRAINT "substitute_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitute_assignments" ADD CONSTRAINT "substitute_assignments_substitute_teacher_id_users_id_fk" FOREIGN KEY ("substitute_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitute_assignments" ADD CONSTRAINT "substitute_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "substitute_assignment_unique" ON "substitute_assignments" USING btree ("course_id","block_number","date");