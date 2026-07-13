import "server-only";
import { db } from "@/db";
import { notificationQueue, attendanceRecords, students, guardians, courses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getFailedNotifications() {
  return db
    .select({
      queueId: notificationQueue.id,
      kind: notificationQueue.kind,
      attempts: notificationQueue.attempts,
      date: attendanceRecords.date,
      blockNumber: attendanceRecords.blockNumber,
      status: attendanceRecords.status,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      courseName: courses.name,
      guardianName: guardians.fullName,
      guardianPhone: guardians.phoneE164,
    })
    .from(notificationQueue)
    .innerJoin(attendanceRecords, eq(notificationQueue.attendanceRecordId, attendanceRecords.id))
    .innerJoin(students, eq(attendanceRecords.studentId, students.id))
    .innerJoin(courses, eq(attendanceRecords.courseId, courses.id))
    .leftJoin(guardians, eq(students.guardianId, guardians.id))
    .where(eq(notificationQueue.status, "failed"))
    .orderBy(desc(attendanceRecords.date));
}
