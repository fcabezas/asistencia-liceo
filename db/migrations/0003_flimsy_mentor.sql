CREATE TYPE "public"."student_tag_type" AS ENUM('pase_ingreso', 'condicion_especial', 'internado', 'colacion');--> statement-breakpoint
CREATE TABLE "inspector_substitute_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"absent_inspector_id" integer NOT NULL,
	"substitute_inspector_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_exits" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" date NOT NULL,
	"exit_time" time NOT NULL,
	"reason" text NOT NULL,
	"registered_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"tag_type" "student_tag_type" NOT NULL,
	"label" text,
	"notes" text,
	"until_time" time,
	"valid_from" date,
	"valid_until" date,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inspector_substitute_assignments" ADD CONSTRAINT "inspector_substitute_assignments_absent_inspector_id_users_id_fk" FOREIGN KEY ("absent_inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspector_substitute_assignments" ADD CONSTRAINT "inspector_substitute_assignments_substitute_inspector_id_users_id_fk" FOREIGN KEY ("substitute_inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspector_substitute_assignments" ADD CONSTRAINT "inspector_substitute_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_exits" ADD CONSTRAINT "student_exits_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_exits" ADD CONSTRAINT "student_exits_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;