import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { scheduleBlocks, courses, subjects, substituteAssignments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { chileToday } from "@/lib/date";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacherId = Number(session.user.id);
  const { date, isoWeekday } = chileToday();
  const settings = await db.query.schoolSettings.findFirst();
  const currentYear = settings?.currentYear ?? new Date().getFullYear();

  const ownBlocks = await db
    .select({
      id: scheduleBlocks.id,
      blockNumber: scheduleBlocks.blockNumber,
      startTime: scheduleBlocks.startTime,
      endTime: scheduleBlocks.endTime,
      courseId: scheduleBlocks.courseId,
      courseName: courses.name,
      subjectId: scheduleBlocks.subjectId,
      subjectName: subjects.name,
    })
    .from(scheduleBlocks)
    .innerJoin(courses, eq(scheduleBlocks.courseId, courses.id))
    .innerJoin(subjects, eq(scheduleBlocks.subjectId, subjects.id))
    .where(
      and(
        eq(scheduleBlocks.teacherId, teacherId),
        eq(scheduleBlocks.dayOfWeek, isoWeekday),
        eq(scheduleBlocks.year, currentYear)
      )
    );

  const substituteBlocks = await db
    .select({
      id: scheduleBlocks.id,
      blockNumber: scheduleBlocks.blockNumber,
      startTime: scheduleBlocks.startTime,
      endTime: scheduleBlocks.endTime,
      courseId: scheduleBlocks.courseId,
      courseName: courses.name,
      subjectId: scheduleBlocks.subjectId,
      subjectName: subjects.name,
    })
    .from(substituteAssignments)
    .innerJoin(
      scheduleBlocks,
      and(
        eq(scheduleBlocks.courseId, substituteAssignments.courseId),
        eq(scheduleBlocks.blockNumber, substituteAssignments.blockNumber),
        eq(scheduleBlocks.dayOfWeek, isoWeekday),
        eq(scheduleBlocks.year, currentYear)
      )
    )
    .innerJoin(courses, eq(scheduleBlocks.courseId, courses.id))
    .innerJoin(subjects, eq(scheduleBlocks.subjectId, subjects.id))
    .where(
      and(
        eq(substituteAssignments.substituteTeacherId, teacherId),
        eq(substituteAssignments.date, date)
      )
    );

  const blocks = [
    ...ownBlocks.map((b) => ({ ...b, isSubstitute: false })),
    ...substituteBlocks.map((b) => ({ ...b, isSubstitute: true })),
  ].sort((a, b) => a.blockNumber - b.blockNumber);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Mis bloques de hoy</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-brand-300">{date}</p>

      {blocks.length === 0 ? (
        <p className="mt-4 text-zinc-600 dark:text-brand-200">
          No tienes bloques asignados hoy.
        </p>
      ) : (
        <ul className="mt-6 flex max-w-lg flex-col gap-3">
          {blocks.map((b) => (
            <li
              key={`${b.id}-${b.isSubstitute}`}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-brand-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-brand-900 dark:text-white">
                  Bloque {b.blockNumber} · {b.courseName} · {b.subjectName}
                  {b.isSubstitute && (
                    <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-800 dark:bg-gold-900 dark:text-gold-200">
                      Reemplazo
                    </span>
                  )}
                </p>
                {b.startTime && (
                  <p className="text-zinc-500 dark:text-brand-300">
                    {b.startTime}
                    {b.endTime ? ` - ${b.endTime}` : ""}
                  </p>
                )}
              </div>
              <Link
                href={`/attendance/${b.courseId}/${b.blockNumber}?subjectId=${b.subjectId}`}
                className="btn-primary w-full sm:w-auto"
              >
                Pasar asistencia
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
