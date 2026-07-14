import "server-only";
import { db } from "@/db";
import {
  notificationQueue,
  attendanceRecords,
  students,
  guardians,
  courses,
} from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

export type PendingNotification = {
  queueId: number;
  kind: "inicial" | "correccion";
  date: string;
  status: "ausente" | "atraso" | "presente" | "justificado";
  studentFirstName: string;
  studentLastName: string;
  courseName: string;
  guardianName: string | null;
  guardianPhone: string | null;
};

function buildWhatsAppMessage(p: {
  kind: "inicial" | "correccion";
  status: string;
  studentName: string;
  courseName: string;
  date: string;
}): string {
  if (p.kind === "correccion") {
    return `Estimado apoderado(a), le informamos que el registro de asistencia de ${p.studentName} (${p.courseName}) del día ${p.date} fue corregido: el estado actual es "${p.status}". Disculpe las molestias. Liceo Eduardo Charme.`;
  }
  if (p.status === "atraso") {
    return `Estimado apoderado(a), le informamos que ${p.studentName} del curso ${p.courseName} registró atraso el día ${p.date}. Ante cualquier consulta, contáctenos. Liceo Eduardo Charme.`;
  }
  return `Estimado apoderado(a), le informamos que ${p.studentName} del curso ${p.courseName} no registró asistencia el día ${p.date}. Ante cualquier consulta, contáctenos. Liceo Eduardo Charme.`;
}

/** wa.me deep link that opens a chat with the message already typed in. */
export function whatsAppLink(phoneE164: string, message: string): string {
  const digits = phoneE164.replace("+", "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function getPendingNotifications(
  courseIds: number[]
): Promise<(PendingNotification & { message: string; link: string | null })[]> {
  if (courseIds.length === 0) return [];

  const rows = await db
    .select({
      queueId: notificationQueue.id,
      kind: notificationQueue.kind,
      date: attendanceRecords.date,
      status: attendanceRecords.status,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      courseName: courses.name,
      guardianName: guardians.fullName,
      guardianPhone: guardians.phoneE164,
    })
    .from(notificationQueue)
    .innerJoin(attendanceRecords, eq(notificationQueue.attendanceRecordId, attendanceRecords.id))
    .innerJoin(students, eq(attendanceRecords.studentId, students.id))
    .innerJoin(courses, eq(attendanceRecords.courseId, courses.id))
    .leftJoin(guardians, eq(students.guardianId, guardians.id))
    .where(
      and(
        eq(notificationQueue.status, "queued"),
        inArray(attendanceRecords.courseId, courseIds)
      )
    )
    .orderBy(asc(attendanceRecords.date));

  return rows.map((r) => {
    const studentName = `${r.studentFirstName} ${r.studentLastName}`;
    const message = buildWhatsAppMessage({
      kind: r.kind,
      status: r.status,
      studentName,
      courseName: r.courseName,
      date: r.date,
    });
    return {
      ...r,
      message,
      link: r.guardianPhone ? whatsAppLink(r.guardianPhone, message) : null,
    };
  });
}
