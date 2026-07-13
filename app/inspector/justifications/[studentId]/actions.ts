"use server";

import { requireRole } from "@/lib/authz";
import { canInspectStudent, createJustification } from "@/lib/justifications";
import { revalidatePath } from "next/cache";

export async function createJustificationAction(studentId: number, formData: FormData) {
  const session = await requireRole("inspector_general", "inspector_pasillo");
  const inspectorId = Number(session.user.id);

  const allowed = await canInspectStudent(session.user.role, inspectorId, studentId);
  if (!allowed) {
    throw new Error("No tienes este curso asignado.");
  }

  const reason = String(formData.get("reason") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const days = Number(formData.get("days") ?? 1);

  if (!reason) throw new Error("Falta el motivo de la justificación.");
  if (!startDate) throw new Error("Falta la fecha de inicio.");
  if (!days || days < 1) throw new Error("La cantidad de días debe ser al menos 1.");

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + (days - 1));
  const endDate = end.toISOString().slice(0, 10);

  await createJustification({
    studentId,
    createdBy: inspectorId,
    reason,
    startDate,
    endDate,
  });

  revalidatePath(`/inspector/justifications/${studentId}`);
}
