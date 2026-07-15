"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { scheduleBlocks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { chileToday } from "@/lib/date";
import { saveAttendance, type AttendanceStatusInput } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

export async function saveAttendanceAction(input: {
  courseId: number;
  blockNumber: number;
  statuses: { studentId: number; status: AttendanceStatusInput }[];
}) {
  const session = await requireRole("teacher", "admin");
  const teacherId = Number(session.user.id);

  const { date, isoWeekday } = chileToday();
  const settings = await db.query.schoolSettings.findFirst();
  const year = settings?.currentYear ?? new Date().getFullYear();

  // Re-derive the subject from the schedule instead of trusting the client,
  // and confirm this teacher is actually assigned to this block today.
  const block = await db.query.scheduleBlocks.findFirst({
    where: and(
      eq(scheduleBlocks.teacherId, teacherId),
      eq(scheduleBlocks.courseId, input.courseId),
      eq(scheduleBlocks.blockNumber, input.blockNumber),
      eq(scheduleBlocks.dayOfWeek, isoWeekday),
      eq(scheduleBlocks.year, year)
    ),
  });

  if (!block) {
    throw new Error("No tienes este bloque asignado hoy.");
  }

  await saveAttendance({
    courseId: input.courseId,
    subjectId: block.subjectId,
    teacherId,
    blockNumber: input.blockNumber,
    date,
    statuses: input.statuses,
  });

  revalidatePath(`/attendance/${input.courseId}/${input.blockNumber}`);
}
