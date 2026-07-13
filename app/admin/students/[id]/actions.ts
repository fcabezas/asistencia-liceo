"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { students, guardians } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidRut, formatRut } from "@/lib/rut";
import { normalizeChileanMobile } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateStudent(studentId: number, formData: FormData) {
  await requireRole("admin");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const courseId = Number(formData.get("courseId"));

  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const guardianPhoneRaw = String(formData.get("guardianPhone") ?? "").trim();
  const guardianEmail = String(formData.get("guardianEmail") ?? "").trim() || null;
  const guardianRutRaw = String(formData.get("guardianRut") ?? "").trim();

  if (!firstName || !lastName || !courseId) {
    throw new Error("Faltan datos del estudiante.");
  }

  const guardianPhone = normalizeChileanMobile(guardianPhoneRaw);
  if (!guardianPhone) {
    throw new Error(`Teléfono de apoderado inválido: "${guardianPhoneRaw}".`);
  }

  let guardianRut: string | null = null;
  if (guardianRutRaw) {
    if (!isValidRut(guardianRutRaw)) {
      throw new Error(`RUT de apoderado inválido: "${guardianRutRaw}".`);
    }
    guardianRut = formatRut(guardianRutRaw);
  }

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student) throw new Error("Estudiante no encontrado.");

  if (student.guardianId) {
    await db
      .update(guardians)
      .set({ fullName: guardianName, phoneE164: guardianPhone, email: guardianEmail, rut: guardianRut })
      .where(eq(guardians.id, student.guardianId));
  } else {
    const [created] = await db
      .insert(guardians)
      .values({ fullName: guardianName, phoneE164: guardianPhone, email: guardianEmail, rut: guardianRut })
      .returning({ id: guardians.id });
    await db.update(students).set({ guardianId: created.id }).where(eq(students.id, studentId));
  }

  await db.update(students).set({ firstName, lastName, courseId }).where(eq(students.id, studentId));

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  redirect("/admin/students");
}
