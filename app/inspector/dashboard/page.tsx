import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  scheduleBlocks,
  subjects,
  users,
  attendanceRecords,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { chileToday } from "@/lib/date";
import { getScopedCourses } from "@/lib/inspector-scope";

export default async function InspectorDashboard() {
  const session = await auth();
  const role = session?.user?.role;
  if (
    !session?.user ||
    (role !== "inspector_general" && role !== "inspector_pasillo")
  ) {
    redirect("/login");
  }

  const inspectorId = Number(session.user.id);
  const { date, isoWeekday } = chileToday();
  const settings = await db.query.schoolSettings.findFirst();
  const year = settings?.currentYear ?? new Date().getFullYear();

  const scopedCourses = await getScopedCourses(role, inspectorId);
  const courseIds = scopedCourses.map((c) => c.id);

  const blocksToday = courseIds.length
    ? await db
        .select()
        .from(scheduleBlocks)
        .where(
          and(
            inArray(scheduleBlocks.courseId, courseIds),
            eq(scheduleBlocks.blockNumber, 1),
            eq(scheduleBlocks.dayOfWeek, isoWeekday),
            eq(scheduleBlocks.year, year),
          ),
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
                  blocksToday.map((b) => b.courseId),
                ),
              ),
            )
        ).map((r) => r.courseId),
      )
    : new Set<number>();

  const [allSubjects, allTeachers] = await Promise.all([
    db.select().from(subjects),
    db.select().from(users).where(eq(users.role, "teacher")),
  ]);

  const pending = blocksToday.filter((b) => !takenCourseIds.has(b.courseId));

  const courseName = (id: number) =>
    scopedCourses.find((c) => c.id === id)?.name ?? id;
  const subjectName = (id: number) =>
    allSubjects.find((s) => s.id === id)?.name ?? id;
  const teacherName = (id: number) =>
    allTeachers.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Asistencia de bloque 1 no tomada
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-brand-300">{date}</p>

      {scopedCourses.length === 0 ? (
        <p className="mt-4 text-zinc-600 dark:text-brand-300">
          No tienes cursos asignados todavía.
        </p>
      ) : pending.length === 0 ? (
        <p className="mt-4 text-green-700 dark:text-green-400">
          Todos los cursos con bloque 1 hoy ya registraron asistencia.
        </p>
      ) : (
        <div className="mt-6 max-w-2xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Curso</th>
                <th className="p-2">Asignatura</th>
                <th className="p-2">Profesor</th>
                <th className="p-2">Hora de inicio</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((b) => (
                <tr
                  key={b.id}
                  className="border-b bg-red-50 dark:bg-red-950/40"
                >
                  <td className="p-2">{courseName(b.courseId)}</td>
                  <td className="p-2">{subjectName(b.subjectId)}</td>
                  <td className="p-2">{teacherName(b.teacherId)}</td>
                  <td className="p-2">{b.startTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
