"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { studentTags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const TAG_TYPES = ["pase_ingreso", "condicion_especial", "internado", "colacion"] as const;

export async function addStudentTag(studentId: number, formData: FormData) {
  const session = await requireRole("admin", "inspector_general");

  const tagType = String(formData.get("tagType") ?? "");
  if (!TAG_TYPES.includes(tagType as (typeof TAG_TYPES)[number])) {
    throw new Error("Tipo de etiqueta inválido.");
  }

  const label = String(formData.get("label") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const untilTime = String(formData.get("untilTime") ?? "").trim() || null;
  const validFrom = String(formData.get("validFrom") ?? "").trim() || null;
  const validUntil = String(formData.get("validUntil") ?? "").trim() || null;

  if (tagType === "pase_ingreso" && !untilTime) {
    throw new Error("El pase de ingreso necesita una hora límite.");
  }

  await db.insert(studentTags).values({
    studentId,
    tagType: tagType as (typeof TAG_TYPES)[number],
    label,
    notes,
    untilTime: tagType === "pase_ingreso" ? untilTime : null,
    validFrom,
    validUntil,
    createdBy: Number(session.user.id),
  });

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/inspector/students/${studentId}`);
}

export async function removeStudentTag(tagId: number, studentId: number) {
  await requireRole("admin", "inspector_general");

  await db.delete(studentTags).where(eq(studentTags.id, tagId));

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/inspector/students/${studentId}`);
}
