import "server-only";
import { db } from "@/db";
import { notificationLog, notificationQueue } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SENT_STATUSES = ["sent", "delivered", "read"] as const;

/**
 * Keeps notification_queue in sync with the current notifiable state of an
 * attendance record. Called both when attendance is saved/edited and when a
 * justification is created after the fact.
 *
 * - Not yet notified and now notifiable: queue the initial send.
 * - Already sent and no longer notifiable (corrected or justified after the
 *   fact): queue a correction/apology message.
 * - Queued but not yet sent and no longer notifiable: cancel the pending send.
 * - Already sent and still notifiable: no-op (avoid duplicate sends).
 */
export async function reconcileNotification(
  tx: Transaction,
  attendanceRecordId: number,
  isNotifiable: boolean
) {
  const priorNotification = await tx.query.notificationLog.findFirst({
    where: eq(notificationLog.attendanceRecordId, attendanceRecordId),
    orderBy: desc(notificationLog.sentAt),
  });
  const alreadySent = Boolean(
    priorNotification && SENT_STATUSES.includes(priorNotification.status as (typeof SENT_STATUSES)[number])
  );

  if (isNotifiable) {
    if (!alreadySent) {
      const existingQueue = await tx.query.notificationQueue.findFirst({
        where: and(
          eq(notificationQueue.attendanceRecordId, attendanceRecordId),
          eq(notificationQueue.kind, "inicial"),
          eq(notificationQueue.status, "queued")
        ),
      });
      if (!existingQueue) {
        await tx.insert(notificationQueue).values({ attendanceRecordId, kind: "inicial" });
      }
    }
    return;
  }

  if (alreadySent) {
    await tx.insert(notificationQueue).values({ attendanceRecordId, kind: "correccion" });
  } else {
    await tx
      .update(notificationQueue)
      .set({ status: "done" })
      .where(
        and(
          eq(notificationQueue.attendanceRecordId, attendanceRecordId),
          eq(notificationQueue.kind, "inicial"),
          eq(notificationQueue.status, "queued")
        )
      );
  }
}
