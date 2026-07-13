import "server-only";
import { db } from "@/db";
import { attendanceRecords, justifications, inspectorCourseAssignments, students } from "@/db/schema";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { reconcileNotification } from "@/lib/notifications";

export async function canInspectStudent(
  inspectorRole: string,
  inspectorId: number,
  studentId: number
): Promise<boolean> {
  if (inspectorRole === "inspector_general") return true;
  if (inspectorRole !== "inspector_pasillo") return false;

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student) return false;

  const assignment = await db.query.inspectorCourseAssignments.findFirst({
    where: and(
      eq(inspectorCourseAssignments.inspectorId, inspectorId),
      eq(inspectorCourseAssignments.courseId, student.courseId)
    ),
  });
  return Boolean(assignment);
}

export async function createJustification(opts: {
  studentId: number;
  createdBy: number;
  reason: string;
  startDate: string;
  endDate: string;
}) {
  return db.transaction(async (tx) => {
    const [justification] = await tx
      .insert(justifications)
      .values({
        studentId: opts.studentId,
        createdBy: opts.createdBy,
        reason: opts.reason,
        startDate: opts.startDate,
        endDate: opts.endDate,
      })
      .returning();

    // Retroactively apply to any block-1 records already in this range.
    const records = await tx.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.studentId, opts.studentId),
        eq(attendanceRecords.blockNumber, 1),
        gte(attendanceRecords.date, opts.startDate),
        lte(attendanceRecords.date, opts.endDate),
        inArray(attendanceRecords.status, ["ausente", "atraso"])
      ),
    });

    for (const record of records) {
      await tx
        .update(attendanceRecords)
        .set({ justificationId: justification.id })
        .where(eq(attendanceRecords.id, record.id));

      await reconcileNotification(tx, record.id, false);
    }

    return justification;
  });
}
