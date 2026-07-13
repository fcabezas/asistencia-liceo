"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { courses, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCourse(formData: FormData) {
  await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const gradeLevel = String(formData.get("gradeLevel") ?? "").trim();
  const year = Number(formData.get("year"));

  if (!name || !gradeLevel || !year) {
    throw new Error("Faltan datos del curso.");
  }

  await db.insert(courses).values({ name, gradeLevel, year });
  revalidatePath("/admin/courses");
}

export async function toggleCourseActive(courseId: number, isActive: boolean) {
  await requireRole("admin");
  await db.update(courses).set({ isActive }).where(eq(courses.id, courseId));
  revalidatePath("/admin/courses");
}

export async function createSubject(formData: FormData) {
  await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre de la asignatura.");

  await db.insert(subjects).values({ name }).onConflictDoNothing();
  revalidatePath("/admin/courses");
}
