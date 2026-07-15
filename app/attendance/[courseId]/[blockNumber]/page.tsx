import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  scheduleBlocks,
  students,
  attendanceRecords,
  justifications,
  courses,
  subjects,
} from "@/db/schema";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { chileToday } from "@/lib/date";
import AttendanceGrid from "@/components/AttendanceGrid";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ courseId: string; blockNumber: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "teacher" && session.user.role !== "admin") redirect("/dashboard");

  const { courseId: courseIdParam, blockNumber: blockNumberParam } = await params;
  const courseId = Number(courseIdParam);
  const blockNumber = Number(blockNumberParam);
  const teacherId = Number(session.user.id);

  const { date, isoWeekday } = chileToday();
  const settings = await db.query.schoolSettings.findFirst();
  const year = settings?.currentYear ?? new Date().getFullYear();

  const block = await db.query.scheduleBlocks.findFirst({
    where: and(
      eq(scheduleBlocks.teacherId, teacherId),
      eq(scheduleBlocks.courseId, courseId),
      eq(scheduleBlocks.blockNumber, blockNumber),
      eq(scheduleBlocks.dayOfWeek, isoWeekday),
      eq(scheduleBlocks.year, year)
    ),
  });

  if (!block) {
    notFound();
  }

  const [course, subject, courseStudents] = await Promise.all([
    db.query.courses.findFirst({ where: eq(courses.id, courseId) }),
    db.query.subjects.findFirst({ where: eq(subjects.id, block.subjectId) }),
    db
      .select({ id: students.id, firstName: students.firstName, lastName: students.lastName })
      .from(students)
      .where(and(eq(students.courseId, courseId), eq(students.isActive, true)))
      .orderBy(asc(students.lastName), asc(students.firstName)),
  ]);

  const studentIds = courseStudents.map((s) => s.id);

  const [todayRecords, activeJustifications] = await Promise.all([
    studentIds.length
      ? db
          .select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.date, date),
              inArray(attendanceRecords.studentId, studentIds)
            )
          )
      : [],
    studentIds.length
      ? db
          .select()
          .from(justifications)
          .where(
            and(
              inArray(justifications.studentId, studentIds),
              lte(justifications.startDate, date),
              gte(justifications.endDate, date)
            )
          )
      : [],
  ]);

  // If this block was already taken, use its own values. Otherwise, prefill
  // with the latest status from an earlier block today so teachers only have
  // to confirm/adjust exceptions instead of starting from scratch each time.
  const thisBlockRecords = todayRecords.filter((r) => r.blockNumber === blockNumber);
  const priorBlockRecords = todayRecords
    .filter((r) => r.blockNumber < blockNumber)
    .sort((a, b) => b.blockNumber - a.blockNumber);

  const initialStatuses: Record<number, "presente" | "ausente" | "atraso"> = {};
  let carriedOver = false;
  for (const studentId of studentIds) {
    const own = thisBlockRecords.find((r) => r.studentId === studentId);
    if (own) {
      if (own.status === "presente" || own.status === "ausente" || own.status === "atraso") {
        initialStatuses[studentId] = own.status;
      }
      continue;
    }
    const prior = priorBlockRecords.find((r) => r.studentId === studentId);
    if (prior && (prior.status === "presente" || prior.status === "ausente" || prior.status === "atraso")) {
      initialStatuses[studentId] = prior.status;
      carriedOver = true;
    }
  }

  const justifiedStudentIds = activeJustifications.map((j) => j.studentId);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        {course?.name} · Bloque {blockNumber} · {subject?.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-brand-300">{date}</p>

      <div className="mt-6">
        <AttendanceGrid
          courseId={courseId}
          blockNumber={blockNumber}
          students={courseStudents}
          initialStatuses={initialStatuses}
          justifiedStudentIds={justifiedStudentIds}
          carriedOver={carriedOver}
        />
      </div>
    </div>
  );
}
