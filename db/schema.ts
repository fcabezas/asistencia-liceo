import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  time,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "admin",
  "director",
  "inspector_general",
  "inspector_pasillo",
  "teacher",
]);

export const identifierType = pgEnum("identifier_type", ["rut", "pasaporte"]);

export const attendanceStatus = pgEnum("attendance_status", [
  "presente",
  "ausente",
  "atraso",
  "justificado",
]);

export const notificationKind = pgEnum("notification_kind", [
  "inicial",
  "correccion",
]);

export const notificationQueueStatus = pgEnum("notification_queue_status", [
  "queued",
  "processing",
  "done",
  "failed",
]);

export const notificationLogStatus = pgEnum("notification_log_status", [
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const schoolSettings = pgTable("school_settings", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("America/Santiago"),
  currentYear: integer("current_year").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRole("role").notNull().default("teacher"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const teacherCourseSubjects = pgTable(
  "teacher_course_subjects",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id").notNull().references(() => users.id),
    courseId: integer("course_id").notNull().references(() => courses.id),
    subjectId: integer("subject_id").notNull().references(() => subjects.id),
    year: integer("year").notNull(),
  },
  (t) => [
    uniqueIndex("tcs_unique").on(t.teacherId, t.courseId, t.subjectId, t.year),
  ]
);

export const inspectorCourseAssignments = pgTable(
  "inspector_course_assignments",
  {
    id: serial("id").primaryKey(),
    inspectorId: integer("inspector_id").notNull().references(() => users.id),
    courseId: integer("course_id").notNull().references(() => courses.id),
  },
  (t) => [uniqueIndex("ica_unique").on(t.inspectorId, t.courseId)]
);

export const scheduleBlocks = pgTable(
  "schedule_blocks",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull().references(() => courses.id),
    dayOfWeek: integer("day_of_week").notNull(), // 1=lunes .. 7=domingo
    blockNumber: integer("block_number").notNull(),
    subjectId: integer("subject_id").notNull().references(() => subjects.id),
    teacherId: integer("teacher_id").notNull().references(() => users.id),
    startTime: time("start_time"),
    endTime: time("end_time"),
    year: integer("year").notNull(),
  },
  (t) => [
    uniqueIndex("schedule_block_unique").on(
      t.courseId,
      t.dayOfWeek,
      t.blockNumber,
      t.year
    ),
  ]
);

export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  email: text("email"),
  rut: text("rut"),
  optOut: boolean("opt_out").notNull().default(false),
});

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    identifier: text("identifier").notNull(),
    identifierType: identifierType("identifier_type").notNull().default("rut"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    courseId: integer("course_id").notNull().references(() => courses.id),
    guardianId: integer("guardian_id").references(() => guardians.id),
    birthDate: date("birth_date"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("student_identifier_unique").on(t.identifierType, t.identifier),
  ]
);

export const justifications = pgTable("justifications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull().references(() => students.id),
    courseId: integer("course_id").notNull().references(() => courses.id),
    subjectId: integer("subject_id").notNull().references(() => subjects.id),
    teacherId: integer("teacher_id").notNull().references(() => users.id),
    date: date("date").notNull(),
    blockNumber: integer("block_number").notNull(),
    status: attendanceStatus("status").notNull(),
    justificationId: integer("justification_id").references(() => justifications.id),
    markedAt: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("attendance_unique").on(t.studentId, t.date, t.blockNumber),
  ]
);

export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  attendanceRecordId: integer("attendance_record_id")
    .notNull()
    .references(() => attendanceRecords.id),
  kind: notificationKind("kind").notNull(),
  status: notificationQueueStatus("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationLog = pgTable("notification_log", {
  id: serial("id").primaryKey(),
  attendanceRecordId: integer("attendance_record_id")
    .notNull()
    .references(() => attendanceRecords.id),
  guardianId: integer("guardian_id").notNull().references(() => guardians.id),
  phoneE164Snapshot: text("phone_e164_snapshot").notNull(),
  templateName: text("template_name").notNull(),
  templateVariables: jsonb("template_variables"),
  whatsappMessageId: text("whatsapp_message_id"),
  status: notificationLogStatus("status").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }),
});
