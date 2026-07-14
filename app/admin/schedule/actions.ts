"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { scheduleBlocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createScheduleBlock(formData: FormData) {
  await requireRole("admin");

  const courseId = Number(formData.get("courseId"));
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const blockNumber = Number(formData.get("blockNumber"));
  const subjectId = Number(formData.get("subjectId"));
  const teacherId = Number(formData.get("teacherId"));
  const startTime = String(formData.get("startTime") ?? "") || null;
  const endTime = String(formData.get("endTime") ?? "") || null;
  const year = Number(formData.get("year"));

  if (!courseId || !dayOfWeek || !blockNumber || !subjectId || !teacherId || !year) {
    throw new Error("Faltan datos del bloque de horario.");
  }
  if (blockNumber === 1 && !startTime) {
    throw new Error("El bloque 1 requiere hora de inicio (se usa para detectar asistencia no tomada).");
  }

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

  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const blockNumber = Number(formData.get("blockNumber"));
  const subjectId = Number(formData.get("subjectId"));
  const teacherId = Number(formData.get("teacherId"));
  const startTime = String(formData.get("startTime") ?? "") || null;
  const endTime = String(formData.get("endTime") ?? "") || null;

  if (!dayOfWeek || !blockNumber || !subjectId || !teacherId) {
    throw new Error("Faltan datos del bloque de horario.");
  }
  if (blockNumber === 1 && !startTime) {
    throw new Error("El bloque 1 requiere hora de inicio (se usa para detectar asistencia no tomada).");
  }

  await db
    .update(scheduleBlocks)
    .set({ dayOfWeek, blockNumber, subjectId, teacherId, startTime, endTime })
    .where(eq(scheduleBlocks.id, blockId));

  revalidatePath("/admin/schedule");
}

export async function deleteScheduleBlock(blockId: number) {
  await requireRole("admin");
  await db.delete(scheduleBlocks).where(eq(scheduleBlocks.id, blockId));
  revalidatePath("/admin/schedule");
}
