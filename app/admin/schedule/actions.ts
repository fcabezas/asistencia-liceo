"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { scheduleBlocks, bellSchedule } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function dayGroupFor(dayOfWeek: number): "lunes_jueves" | "viernes" {
  return dayOfWeek === 5 ? "viernes" : "lunes_jueves";
}

async function getBellTimes(dayOfWeek: number, blockNumber: number) {
  const bell = await db.query.bellSchedule.findFirst({
    where: and(
      eq(bellSchedule.dayGroup, dayGroupFor(dayOfWeek)),
      eq(bellSchedule.blockNumber, blockNumber)
    ),
  });
  if (!bell) {
    throw new Error(
      "Falta configurar la hora de este bloque en \"Horas de bloque\" antes de asignar asignatura y profesor."
    );
  }
  return { startTime: bell.startTime, endTime: bell.endTime };
}

export async function createScheduleBlock(formData: FormData) {
  await requireRole("admin");

  const courseId = Number(formData.get("courseId"));
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const blockNumber = Number(formData.get("blockNumber"));
  const subjectId = Number(formData.get("subjectId"));
  const teacherId = Number(formData.get("teacherId"));
  const year = Number(formData.get("year"));

  if (!courseId || !dayOfWeek || !blockNumber || !subjectId || !teacherId || !year) {
    throw new Error("Faltan datos del bloque de horario.");
  }

  const { startTime, endTime } = await getBellTimes(dayOfWeek, blockNumber);

  await db.insert(scheduleBlocks).values({
    courseId,
    dayOfWeek,
    blockNumber,
    subjectId,
    teacherId,
    startTime,
    endTime,
    year,
  });

  revalidatePath("/admin/schedule");
}

export async function updateScheduleBlock(blockId: number, formData: FormData) {
  await requireRole("admin");

  const subjectId = Number(formData.get("subjectId"));
  const teacherId = Number(formData.get("teacherId"));

  if (!subjectId || !teacherId) {
    throw new Error("Faltan datos del bloque de horario.");
  }

  await db
    .update(scheduleBlocks)
    .set({ subjectId, teacherId })
    .where(eq(scheduleBlocks.id, blockId));

  revalidatePath("/admin/schedule");
}

export async function deleteScheduleBlock(blockId: number) {
  await requireRole("admin");
  await db.delete(scheduleBlocks).where(eq(scheduleBlocks.id, blockId));
  revalidatePath("/admin/schedule");
}
