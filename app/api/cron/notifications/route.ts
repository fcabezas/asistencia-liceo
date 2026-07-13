import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  notificationQueue,
  notificationLog,
  attendanceRecords,
  students,
  guardians,
  courses,
} from "@/db/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { sendTemplateMessage, resolveTemplate } from "@/lib/whatsapp";

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const claimed = await db.transaction(async (tx) => {
    const candidates = await tx
      .select({ id: notificationQueue.id })
      .from(notificationQueue)
      .where(eq(notificationQueue.status, "queued"))
      .orderBy(asc(notificationQueue.createdAt))
      .limit(BATCH_SIZE)
      .for("update", { skipLocked: true });

    if (candidates.length === 0) return [];

    const ids = candidates.map((c) => c.id);
    return tx
      .update(notificationQueue)
      .set({ status: "processing", lockedAt: new Date(), attempts: sql`${notificationQueue.attempts} + 1` })
      .where(inArray(notificationQueue.id, ids))
      .returning();
  });

  let sent = 0;
  let failed = 0;

  for (const job of claimed) {
    try {
      await processJob(job);
      sent++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      const giveUp = job.attempts >= MAX_ATTEMPTS;
      await db
        .update(notificationQueue)
        .set({ status: giveUp ? "failed" : "queued", lockedAt: null })
        .where(eq(notificationQueue.id, job.id));
      console.error(`notification_queue ${job.id} failed (attempt ${job.attempts}):`, message);
    }
  }

  return NextResponse.json({ claimed: claimed.length, sent, failed });
}

async function processJob(job: typeof notificationQueue.$inferSelect) {
  const record = await db.query.attendanceRecords.findFirst({
    where: eq(attendanceRecords.id, job.attendanceRecordId),
  });
  if (!record) throw new Error("attendance_record no encontrado.");

  const student = await db.query.students.findFirst({ where: eq(students.id, record.studentId) });
  if (!student?.guardianId) throw new Error("Estudiante sin apoderado asignado.");

  const guardian = await db.query.guardians.findFirst({ where: eq(guardians.id, student.guardianId) });
  if (!guardian) throw new Error("Apoderado no encontrado.");

  if (guardian.optOut) {
    await db.update(notificationQueue).set({ status: "done" }).where(eq(notificationQueue.id, job.id));
    return;
  }

  const course = await db.query.courses.findFirst({ where: eq(courses.id, record.courseId) });

  const { template, bodyParams } = resolveTemplate({
    kind: job.kind,
    status: record.status,
    studentName: `${student.firstName} ${student.lastName}`,
    courseName: course?.name ?? "",
    date: record.date,
  });

  const { messageId } = await sendTemplateMessage({
    to: guardian.phoneE164,
    template,
    bodyParams,
  });

  await db.insert(notificationLog).values({
    attendanceRecordId: record.id,
    guardianId: guardian.id,
    phoneE164Snapshot: guardian.phoneE164,
    templateName: template,
    templateVariables: bodyParams,
    whatsappMessageId: messageId,
    status: "sent",
  });

  await db.update(notificationQueue).set({ status: "done" }).where(eq(notificationQueue.id, job.id));
}
