"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { users, userRole } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const VALID_ROLES = userRole.enumValues;

export async function updateUserRole(userId: number, formData: FormData) {
  const session = await requireRole("admin");
  const role = String(formData.get("role"));

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    throw new Error("Rol inválido.");
  }
  if (Number(session.user.id) === userId && role !== "admin") {
    throw new Error("No puedes quitarte tu propio rol de admin.");
  }

  await db
    .update(users)
    .set({ role: role as (typeof VALID_ROLES)[number] })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: number, isActive: boolean) {
  await requireRole("admin");
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}
