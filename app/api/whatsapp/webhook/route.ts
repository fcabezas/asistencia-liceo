import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notificationLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/whatsapp";

// Meta's subscription handshake.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

const STATUS_RANK: Record<string, number> = { sent: 0, delivered: 1, read: 2, failed: 3 };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const entries = (payload as { entry?: unknown[] })?.entry ?? [];

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? [];
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value;
      const statuses = (value?.statuses as Array<{ id?: string; status?: string }>) ?? [];

      for (const status of statuses) {
        const messageId = status.id;
        const newStatus = status.status;
        if (!messageId || !newStatus || !(newStatus in STATUS_RANK)) continue;

        // Idempotent by design: Meta may redeliver the same event, and events
        // can arrive out of order. Only known message ids are updated, and
        // status only ever moves forward (sent -> delivered -> read), never
        // backward or reprocessed.
        const existing = await db.query.notificationLog.findFirst({
          where: eq(notificationLog.whatsappMessageId, messageId),
        });
        if (!existing) continue;

        const currentRank = STATUS_RANK[existing.status] ?? -1;
        if (STATUS_RANK[newStatus] <= currentRank) continue;

        await db
          .update(notificationLog)
          .set({
            status: newStatus as "sent" | "delivered" | "read" | "failed",
            statusUpdatedAt: new Date(),
          })
          .where(eq(notificationLog.id, existing.id));
      }
      // Inbound guardian messages (value.messages) aren't processed in this
      // MVP; there's no auto-reply flow yet.
    }
  }

  return NextResponse.json({ ok: true });
}
