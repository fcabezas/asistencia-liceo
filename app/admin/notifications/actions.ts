"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { notificationQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function retryNotification(queueId: number) {
  await requireRole("admin", "inspector_general");
  await db
    .update(notificationQueue)
    .set({ status: "queued", attempts: 0, lockedAt: null })
    .where(eq(notificationQueue.id, queueId));
  revalidatePath("/admin/notifications");
}
