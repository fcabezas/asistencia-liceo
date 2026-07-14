"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { notificationQueue, attendanceRecords, inspectorCourseAssignments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markAsNotified(queueId: number) {
  const session = await requireRole("inspector_general", "inspector_pasillo");

  const queueRow = await db.query.notificationQueue.findFirst({
    where: eq(notificationQueue.id, queueId),
  });
  if (!queueRow) throw new Error("No encontrado.");

  if (session.user.role === "inspector_pasillo") {
    const record = await db.query.attendanceRecords.findFirst({
      where: eq(attendanceRecords.id, queueRow.attendanceRecordId),
    });
    if (!record) throw new Error("No encontrado.");

    const assignment = await db.query.inspectorCourseAssignments.findFirst({
      where: and(
        eq(inspectorCourseAssignments.inspectorId, Number(session.user.id)),
        eq(inspectorCourseAssignments.courseId, record.courseId)
      ),
    });
    if (!assignment) throw new Error("No tienes este curso asignado.");
  }

  await db.update(notificationQueue).set({ status: "done" }).where(eq(notificationQueue.id, queueId));
  revalidatePath("/inspector/pending");
}
