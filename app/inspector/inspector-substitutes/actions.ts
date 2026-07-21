"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { inspectorSubstituteAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInspectorCoverage(formData: FormData) {
  const session = await requireRole("admin", "inspector_general");

  const absentInspectorId = Number(formData.get("absentInspectorId"));
  const substituteInspectorId = Number(formData.get("substituteInspectorId"));
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!absentInspectorId || !substituteInspectorId || !startDate || !endDate) {
    throw new Error("Faltan datos para activar la cobertura.");
  }
  if (absentInspectorId === substituteInspectorId) {
    throw new Error("El inspector ausente y el de cobertura no pueden ser el mismo.");
  }
  if (endDate < startDate) {
    throw new Error("La fecha de término no puede ser anterior a la de inicio.");
  }

  await db.insert(inspectorSubstituteAssignments).values({
    absentInspectorId,
    substituteInspectorId,
    startDate,
    endDate,
    createdBy: Number(session.user.id),
  });

  revalidatePath("/inspector/inspector-substitutes");
  revalidatePath("/admin/inspector-substitutes");
}

export async function cancelInspectorCoverage(id: number) {
  await requireRole("admin", "inspector_general");

  await db.delete(inspectorSubstituteAssignments).where(eq(inspectorSubstituteAssignments.id, id));

  revalidatePath("/inspector/inspector-substitutes");
  revalidatePath("/admin/inspector-substitutes");
}
