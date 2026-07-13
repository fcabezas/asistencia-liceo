"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { teacherCourseSubjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTeacherAssignment(formData: FormData) {
  await requireRole("admin");

  const teacherId = Number(formData.get("teacherId"));
  const courseId = Number(formData.get("courseId"));
  const subjectId = Number(formData.get("subjectId"));
  const year = Number(formData.get("year"));

  if (!teacherId || !courseId || !subjectId || !year) {
    throw new Error("Faltan datos de la asignación.");
  }

  await db
    .insert(teacherCourseSubjects)
    .values({ teacherId, courseId, subjectId, year })
    .onConflictDoNothing();

  revalidatePath("/admin/teachers");
}

export async function deleteTeacherAssignment(id: number) {
  await requireRole("admin");
  await db.delete(teacherCourseSubjects).where(eq(teacherCourseSubjects.id, id));
  revalidatePath("/admin/teachers");
}
