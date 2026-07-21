"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { studentExits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canActOnStudent } from "@/lib/student-exits";

export async function registerExit(formData: FormData) {
  const session = await requireRole("inspector_general", "inspector_pasillo", "admin");
  const userId = Number(session.user.id);

  const studentId = Number(formData.get("studentId"));
  const date = String(formData.get("date") ?? "");
  const exitTime = String(formData.get("exitTime") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!studentId || !date || !exitTime || !reason) {
    throw new Error("Faltan datos para registrar el retiro.");
  }

  const allowed = await canActOnStudent(session.user.role, userId, studentId);
  if (!allowed) {
    throw new Error("No tienes este curso asignado.");
  }

  await db.insert(studentExits).values({
    studentId,
    date,
    exitTime,
    reason,
    registeredBy: userId,
  });

  revalidatePath("/inspector/exits");
  revalidatePath("/admin/exits");
}

export async function cancelExit(id: number) {
  const session = await requireRole("inspector_general", "inspector_pasillo", "admin");
  const userId = Number(session.user.id);

  const row = await db.query.studentExits.findFirst({ where: eq(studentExits.id, id) });
  if (!row) throw new Error("No encontrado.");

  const allowed = await canActOnStudent(session.user.role, userId, row.studentId);
  if (!allowed) {
    throw new Error("No tienes este curso asignado.");
  }

  await db.delete(studentExits).where(eq(studentExits.id, id));
  revalidatePath("/inspector/exits");
  revalidatePath("/admin/exits");
}
