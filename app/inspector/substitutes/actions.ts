"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { substituteAssignments, scheduleBlocks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isoWeekdayOf } from "@/lib/date";
import { getScopedCourses } from "@/lib/inspector-scope";

export async function activateSubstitute(formData: FormData) {
  const session = await requireRole("inspector_general", "inspector_pasillo", "admin");
  const inspectorId = Number(session.user.id);

  const courseId = Number(formData.get("courseId"));
  const blockNumber = Number(formData.get("blockNumber"));
  const date = String(formData.get("date") ?? "");
  const substituteTeacherId = Number(formData.get("substituteTeacherId"));

  if (!courseId || !blockNumber || !date || !substituteTeacherId) {
    throw new Error("Faltan datos para activar el reemplazo.");
  }

  if (session.user.role === "inspector_pasillo") {
    const scoped = await getScopedCourses("inspector_pasillo", inspectorId);
    if (!scoped.some((c) => c.id === courseId)) {
      throw new Error("No tienes este curso asignado.");
    }
  }

  const settings = await db.query.schoolSettings.findFirst();
  const year = settings?.currentYear ?? new Date().getFullYear();
  const dayOfWeek = isoWeekdayOf(date);

  const existingBlock = await db.query.scheduleBlocks.findFirst({
    where: and(
      eq(scheduleBlocks.courseId, courseId),
      eq(scheduleBlocks.blockNumber, blockNumber),
      eq(scheduleBlocks.dayOfWeek, dayOfWeek),
      eq(scheduleBlocks.year, year)
    ),
  });
  if (!existingBlock) {
    throw new Error("Ese curso no tiene ese bloque en el horario para ese día.");
  }

  await db
    .insert(substituteAssignments)
    .values({ courseId, blockNumber, date, substituteTeacherId, createdBy: inspectorId })
    .onConflictDoUpdate({
      target: [
        substituteAssignments.courseId,
        substituteAssignments.blockNumber,
        substituteAssignments.date,
      ],
      set: { substituteTeacherId, createdBy: inspectorId },
    });

  revalidatePath("/inspector/substitutes");
  revalidatePath("/admin/substitutes");
}

export async function cancelSubstitute(id: number) {
  const session = await requireRole("inspector_general", "inspector_pasillo", "admin");
  const inspectorId = Number(session.user.id);

  const row = await db.query.substituteAssignments.findFirst({
    where: eq(substituteAssignments.id, id),
  });
  if (!row) throw new Error("No encontrado.");

  if (session.user.role === "inspector_pasillo") {
    const scoped = await getScopedCourses("inspector_pasillo", inspectorId);
    if (!scoped.some((c) => c.id === row.courseId)) {
      throw new Error("No tienes este curso asignado.");
    }
  }

  await db.delete(substituteAssignments).where(eq(substituteAssignments.id, id));
  revalidatePath("/inspector/substitutes");
  revalidatePath("/admin/substitutes");
}
