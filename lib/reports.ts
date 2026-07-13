import "server-only";
import { db } from "@/db";
import { students, attendanceRecords } from "@/db/schema";
import { and, asc, eq, gte, lte } from "drizzle-orm";

export type StudentAttendanceSummary = {
  id: number;
  firstName: string;
  lastName: string;
  presente: number;
  ausente: number;
  atraso: number;
  justificado: number;
};

/** Block-1 attendance summary per student for a course over a date range. */
export async function getAttendanceSummary(
  courseId: number,
  startDate: string,
  endDate: string
): Promise<StudentAttendanceSummary[]> {
  const studentsList = await db
    .select({ id: students.id, firstName: students.firstName, lastName: students.lastName })
    .from(students)
    .where(and(eq(students.courseId, courseId), eq(students.isActive, true)))
    .orderBy(asc(students.lastName), asc(students.firstName));

  const records = await db
    .select({ studentId: attendanceRecords.studentId, status: attendanceRecords.status })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.courseId, courseId),
        eq(attendanceRecords.blockNumber, 1),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      )
    );

  const counts = new Map<number, Omit<StudentAttendanceSummary, "id" | "firstName" | "lastName">>();
  for (const s of studentsList) {
    counts.set(s.id, { presente: 0, ausente: 0, atraso: 0, justificado: 0 });
  }
  for (const r of records) {
    const c = counts.get(r.studentId);
    if (c) c[r.status]++;
  }

  return studentsList.map((s) => ({ ...s, ...counts.get(s.id)! }));
}
