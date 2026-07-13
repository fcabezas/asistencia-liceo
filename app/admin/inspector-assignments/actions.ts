"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { inspectorCourseAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInspectorAssignment(formData: FormData) {
  await requireRole("admin");

  const inspectorId = Number(formData.get("inspectorId"));
  const courseId = Number(formData.get("courseId"));

  if (!inspectorId || !courseId) {
    throw new Error("Faltan datos de la asignación.");
  }

  await db
    .insert(inspectorCourseAssignments)
    .values({ inspectorId, courseId })
    .onConflictDoNothing();

  revalidatePath("/admin/inspector-assignments");
}

export async function deleteInspectorAssignment(id: number) {
  await requireRole("admin");
  await db.delete(inspectorCourseAssignments).where(eq(inspectorCourseAssignments.id, id));
  revalidatePath("/admin/inspector-assignments");
}
