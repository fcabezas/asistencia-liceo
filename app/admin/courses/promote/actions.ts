"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { students } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function promoteStudents(formData: FormData) {
  await requireRole("admin");

  const fromCourseId = Number(formData.get("fromCourseId"));
  const toCourseId = Number(formData.get("toCourseId"));

  if (!fromCourseId || !toCourseId) {
    throw new Error("Faltan datos de la promoción.");
  }
  if (fromCourseId === toCourseId) {
    throw new Error("El curso de origen y destino no pueden ser el mismo.");
  }

  const result = await db
    .update(students)
    .set({ courseId: toCourseId })
    .where(and(eq(students.courseId, fromCourseId), eq(students.isActive, true)))
    .returning({ id: students.id });

  revalidatePath("/admin/courses/promote");
  return { moved: result.length };
}
