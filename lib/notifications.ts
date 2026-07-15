import "server-only";
import { db } from "@/db";
import { notificationQueue } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
 *
 * "Already sent" is read from notification_queue itself (an inspector marked
 * it "avisado"), not from notification_log: with the manual wa.me workflow
 * nothing ever writes to notification_log, so a correction arriving after the
 * inspector already sent the WhatsApp would otherwise go undetected.
 */
export async function reconcileNotification(
  tx: Transaction,
  attendanceRecordId: number,
  isNotifiable: boolean
) {
  const lastQueueEntry = await tx.query.notificationQueue.findFirst({
    where: eq(notificationQueue.attendanceRecordId, attendanceRecordId),
    orderBy: desc(notificationQueue.id),
  });
  const alreadySent = lastQueueEntry?.status === "done";

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
