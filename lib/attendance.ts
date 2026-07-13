import "server-only";
import { db } from "@/db";
import { attendanceRecords, justifications } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { reconcileNotification } from "@/lib/notifications";

export type AttendanceStatusInput = "presente" | "ausente" | "atraso";

export async function saveAttendance(opts: {
  courseId: number;
  subjectId: number;
  teacherId: number;
  blockNumber: number;
  date: string; // YYYY-MM-DD, fecha local Chile
  statuses: { studentId: number; status: AttendanceStatusInput }[];
}) {
  await db.transaction(async (tx) => {
    for (const s of opts.statuses) {
      const existing = await tx.query.attendanceRecords.findFirst({
        where: and(
          eq(attendanceRecords.studentId, s.studentId),
          eq(attendanceRecords.date, opts.date),
          eq(attendanceRecords.blockNumber, opts.blockNumber)
        ),
      });

      const isAusenteOrAtraso = s.status === "ausente" || s.status === "atraso";

      let justificationId: number | null = null;
      if (opts.blockNumber === 1 && isAusenteOrAtraso) {
        const activeJustification = await tx.query.justifications.findFirst({
          where: and(
            eq(justifications.studentId, s.studentId),
            lte(justifications.startDate, opts.date),
            gte(justifications.endDate, opts.date)
          ),
        });
        justificationId = activeJustification?.id ?? null;
      }

      let recordId: number;
      if (existing) {
        await tx
          .update(attendanceRecords)
          .set({
            status: s.status,
            justificationId,
            teacherId: opts.teacherId,
            subjectId: opts.subjectId,
            updatedAt: new Date(),
          })
          .where(eq(attendanceRecords.id, existing.id));
        recordId = existing.id;
      } else {
        const [created] = await tx
          .insert(attendanceRecords)
          .values({
            studentId: s.studentId,
            courseId: opts.courseId,
            subjectId: opts.subjectId,
            teacherId: opts.teacherId,
            date: opts.date,
            blockNumber: opts.blockNumber,
            status: s.status,
            justificationId,
          })
          .returning({ id: attendanceRecords.id });
        recordId = created.id;
      }

      if (opts.blockNumber !== 1) continue;

      const isNotifiable = isAusenteOrAtraso && !justificationId;
      await reconcileNotification(tx, recordId, isNotifiable);
    }
  });
}
