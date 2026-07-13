CREATE TYPE "public"."attendance_status" AS ENUM('presente', 'ausente', 'atraso', 'justificado');--> statement-breakpoint
CREATE TYPE "public"."identifier_type" AS ENUM('rut', 'pasaporte');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('inicial', 'correccion');--> statement-breakpoint
CREATE TYPE "public"."notification_log_status" AS ENUM('sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_queue_status" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'director', 'inspector_general', 'inspector_pasillo', 'teacher');--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"date" date NOT NULL,
	"block_number" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"justification_id" integer,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"grade_level" text NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"email" text,
	"rut" text,
	"opt_out" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspector_course_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspector_id" integer NOT NULL,
	"course_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "justifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"reason" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_record_id" integer NOT NULL,
	"guardian_id" integer NOT NULL,
	"phone_e164_snapshot" text NOT NULL,
	"template_name" text NOT NULL,
	"template_variables" jsonb,
	"whatsapp_message_id" text,
	"status" "notification_log_status" NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_record_id" integer NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"status" "notification_queue_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"block_number" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"start_time" time,
	"end_time" time,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'America/Santiago' NOT NULL,
	"current_year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"identifier_type" "identifier_type" DEFAULT 'rut' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"course_id" integer NOT NULL,
	"guardian_id" integer,
	"birth_date" date,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "teacher_course_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'teacher' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_justification_id_justifications_id_fk" FOREIGN KEY ("justification_id") REFERENCES "public"."justifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspector_course_assignments" ADD CONSTRAINT "inspector_course_assignments_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspector_course_assignments" ADD CONSTRAINT "inspector_course_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_course_subjects" ADD CONSTRAINT "teacher_course_subjects_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_course_subjects" ADD CONSTRAINT "teacher_course_subjects_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_course_subjects" ADD CONSTRAINT "teacher_course_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_unique" ON "attendance_records" USING btree ("student_id","date","block_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ica_unique" ON "inspector_course_assignments" USING btree ("inspector_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_block_unique" ON "schedule_blocks" USING btree ("course_id","day_of_week","block_number","year");--> statement-breakpoint
CREATE UNIQUE INDEX "student_identifier_unique" ON "students" USING btree ("identifier_type","identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "tcs_unique" ON "teacher_course_subjects" USING btree ("teacher_id","course_id","subject_id","year");