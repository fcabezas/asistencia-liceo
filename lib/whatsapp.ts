import "server-only";
import crypto from "node:crypto";

const GRAPH_API_VERSION = "v20.0";

export type TemplateName = "asistencia_ausente" | "asistencia_atraso" | "asistencia_correccion";

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("Falta configurar WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN.");
  }
  return { phoneNumberId, accessToken };
}

/**
 * Sends a pre-approved WhatsApp template message via the Meta Cloud API.
 * These are always business-initiated (not replies), so they must use a
 * template already approved in Meta Business Manager — see AGENTS.md / plan
 * for the 3 templates this app expects (asistencia_ausente, asistencia_atraso,
 * asistencia_correccion).
 */
export async function sendTemplateMessage(opts: {
  to: string; // E.164, e.g. +56912345678
  template: TemplateName;
  languageCode?: string;
  bodyParams: string[];
}): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken } = getConfig();

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: opts.to.replace("+", ""),
      type: "template",
      template: {
        name: opts.template,
        language: { code: opts.languageCode ?? "es_CL" },
        components: [
          {
            type: "body",
            parameters: opts.bodyParams.map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error?.message ?? `Error de WhatsApp API (HTTP ${res.status})`;
    throw new Error(message);
  }

  const messageId = data?.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("Respuesta de WhatsApp sin message id.");
  }

  return { messageId };
}

/** Verifies Meta's X-Hub-Signature-256 header to make sure a webhook call is genuine. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!signatureHeader || !appSecret) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

type NotificationKind = "inicial" | "correccion";
type AttendanceStatus = "presente" | "ausente" | "atraso" | "justificado";

/** Chooses the template + body variables for a queued notification job. */
export function resolveTemplate(params: {
  kind: NotificationKind;
  status: AttendanceStatus;
  studentName: string;
  courseName: string;
  date: string;
  time?: string;
}): { template: TemplateName; bodyParams: string[] } {
  if (params.kind === "correccion") {
    return {
      template: "asistencia_correccion",
      bodyParams: [params.studentName, params.date, params.status],
    };
  }

  if (params.status === "atraso") {
    return {
      template: "asistencia_atraso",
      bodyParams: [params.studentName, params.courseName, params.date, params.time ?? ""],
    };
  }

  return {
    template: "asistencia_ausente",
    bodyParams: [params.studentName, params.courseName, params.date],
  };
}
