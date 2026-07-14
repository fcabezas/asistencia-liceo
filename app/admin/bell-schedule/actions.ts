"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { bellSchedule } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function upsertBellScheduleBlock(formData: FormData) {
  await requireRole("admin");

  const dayGroupValue = String(formData.get("dayGroup") ?? "");
  const blockNumber = Number(formData.get("blockNumber"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (
    (dayGroupValue !== "lunes_jueves" && dayGroupValue !== "viernes") ||
    !blockNumber ||
    !startTime ||
    !endTime
  ) {
    throw new Error("Faltan datos de la hora de bloque.");
  }

  await db
    .insert(bellSchedule)
    .values({ dayGroup: dayGroupValue, blockNumber, startTime, endTime })
    .onConflictDoUpdate({
      target: [bellSchedule.dayGroup, bellSchedule.blockNumber],
      set: { startTime, endTime },
    });

  revalidatePath("/admin/bell-schedule");
  revalidatePath("/admin/schedule");
}
