import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  students,
  courses,
  users,
  notificationQueue,
  scheduleBlocks,
  attendanceRecords,
} from "@/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { chileToday } from "@/lib/date";
import StatCard from "@/components/StatCard";

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const { date, isoWeekday } = chileToday();
  const settings = await db.query.schoolSettings.findFirst();
  const year = settings?.currentYear ?? new Date().getFullYear();

  const [
    [{ value: studentCount }],
    [{ value: courseCount }],
    [{ value: userCount }],
    [{ value: pendingCount }],
    activeCourses,
  ] = await Promise.all([
    db.select({ value: count() }).from(students).where(eq(students.isActive, true)),
    db.select({ value: count() }).from(courses).where(eq(courses.isActive, true)),
    db.select({ value: count() }).from(users).where(eq(users.isActive, true)),
    db.select({ value: count() }).from(notificationQueue).where(eq(notificationQueue.status, "queued")),
    db.select({ id: courses.id }).from(courses).where(eq(courses.isActive, true)),
  ]);

  const courseIds = activeCourses.map((c) => c.id);

  const blocksToday = courseIds.length
    ? await db
        .select()
        .from(scheduleBlocks)
        .where(
          and(
            inArray(scheduleBlocks.courseId, courseIds),
            eq(scheduleBlocks.blockNumber, 1),
            eq(scheduleBlocks.dayOfWeek, isoWeekday),
            eq(scheduleBlocks.year, year)
          )
        )
    : [];

  const takenCourseIds = blocksToday.length
    ? new Set(
        (
          await db
            .select({ courseId: attendanceRecords.courseId })
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.date, date),
                eq(attendanceRecords.blockNumber, 1),
                inArray(
                  attendanceRecords.courseId,
                  blocksToday.map((b) => b.courseId)
                )
              )
            )
        ).map((r) => r.courseId)
      )
    : new Set<number>();

  const notTakenCount = blocksToday.filter((b) => !takenCourseIds.has(b.courseId)).length;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900">Administración</h1>
      <p className="mt-2 text-zinc-600">
        Gestión de estudiantes, cursos, horario, asignaciones y usuarios.
      </p>

      <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Estudiantes activos" value={studentCount} accent="brand" href="/admin/students" />
        <StatCard label="Cursos activos" value={courseCount} accent="brand" href="/admin/courses" />
        <StatCard label="Usuarios activos" value={userCount} accent="brand" href="/admin/users" />
        <StatCard
          label="Avisos WhatsApp pendientes"
          value={pendingCount}
          accent={pendingCount > 0 ? "gold" : "green"}
        />
        <StatCard
          label="Bloque 1 sin tomar hoy"
          value={notTakenCount}
          accent={notTakenCount > 0 ? "red" : "green"}
        />
      </div>
    </div>
  );
}
