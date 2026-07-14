import { db } from "@/db";
import { courses, subjects, users, scheduleBlocks } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { createScheduleBlock, updateScheduleBlock, deleteScheduleBlock } from "./actions";

const DAYS: { value: number; label: string; blocks: number }[] = [
  { value: 1, label: "Lunes", blocks: 9 },
  { value: 2, label: "Martes", blocks: 9 },
  { value: 3, label: "Miércoles", blocks: 9 },
  { value: 4, label: "Jueves", blocks: 9 },
  { value: 5, label: "Viernes", blocks: 6 },
];

const MAX_BLOCKS = 9;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId: courseIdParam } = await searchParams;

  const [allCourses, allSubjects, allTeachers, settings] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.name)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db
      .select()
      .from(users)
      .where(and(eq(users.role, "teacher"), eq(users.isActive, true))),
    db.query.schoolSettings.findFirst(),
  ]);

  const currentYear = settings?.currentYear ?? new Date().getFullYear();
  const selectedCourseId = courseIdParam
    ? Number(courseIdParam)
    : allCourses[0]?.id;

  const blocks = selectedCourseId
    ? await db
        .select()
        .from(scheduleBlocks)
        .where(
          and(
            eq(scheduleBlocks.courseId, selectedCourseId),
            inArray(
              scheduleBlocks.dayOfWeek,
              DAYS.map((d) => d.value)
            ),
            eq(scheduleBlocks.year, currentYear)
          )
        )
    : [];

  const blockByKey = new Map(blocks.map((b) => [`${b.dayOfWeek}-${b.blockNumber}`, b]));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Horario
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Las horas de cada bloque se toman automáticamente desde{" "}
        <a href="/admin/bell-schedule" className="link-action">
          Horas de bloque
        </a>
        . Aquí solo se asigna asignatura y profesor para cada celda.
      </p>

      <form method="get" className="mt-4 flex items-center gap-2 text-sm">
        <label htmlFor="courseId">Curso:</label>
        <select
          id="courseId"
          name="courseId"
          defaultValue={selectedCourseId}
          className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
        >
          {allCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900">
          Ver
        </button>
      </form>

      {selectedCourseId && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b bg-zinc-50 dark:bg-brand-900">
                <th className="w-16 border-r p-2 dark:border-brand-800">Bloque</th>
                {DAYS.map((d) => (
                  <th key={d.value} className="w-56 border-r p-2 last:border-r-0 dark:border-brand-800">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX_BLOCKS }, (_, i) => i + 1).map((blockNumber) => (
                <tr key={blockNumber} className="border-b align-top dark:border-brand-800">
                  <td className="border-r p-2 font-medium text-zinc-500 dark:border-brand-800 dark:text-brand-300">
                    {blockNumber}
                  </td>
                  {DAYS.map((d) => {
                    if (blockNumber > d.blocks) {
                      return (
                        <td
                          key={d.value}
                          className="border-r p-2 text-zinc-300 last:border-r-0 dark:border-brand-800 dark:text-brand-700"
                        >
                          No aplica
                        </td>
                      );
                    }
                    const existing = blockByKey.get(`${d.value}-${blockNumber}`);
                    return (
                      <td key={d.value} className="border-r p-2 last:border-r-0 dark:border-brand-800">
                        {existing ? (
                          <form
                            action={updateScheduleBlock.bind(null, existing.id)}
                            className="flex flex-col gap-1"
                          >
                            <select
                              name="subjectId"
                              defaultValue={existing.subjectId}
                              className="w-full rounded border border-zinc-300 px-1 py-0.5 dark:border-brand-700 dark:bg-brand-900"
                              required
                            >
                              {allSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <select
                              name="teacherId"
                              defaultValue={existing.teacherId}
                              className="w-full rounded border border-zinc-300 px-1 py-0.5 dark:border-brand-700 dark:bg-brand-900"
                              required
                            >
                              {allTeachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button type="submit" className="link-action">
                                Guardar
                              </button>
                              <button
                                type="submit"
                                formAction={deleteScheduleBlock.bind(null, existing.id)}
                                className="text-red-700 hover:underline dark:text-red-300"
                              >
                                Eliminar
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form action={createScheduleBlock} className="flex flex-col gap-1">
                            <input type="hidden" name="courseId" value={selectedCourseId} />
                            <input type="hidden" name="dayOfWeek" value={d.value} />
                            <input type="hidden" name="blockNumber" value={blockNumber} />
                            <input type="hidden" name="year" value={currentYear} />
                            <select
                              name="subjectId"
                              defaultValue=""
                              className="w-full rounded border border-zinc-300 px-1 py-0.5 dark:border-brand-700 dark:bg-brand-900"
                              required
                            >
                              <option value="" disabled>
                                Asignatura
                              </option>
                              {allSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <select
                              name="teacherId"
                              defaultValue=""
                              className="w-full rounded border border-zinc-300 px-1 py-0.5 dark:border-brand-700 dark:bg-brand-900"
                              required
                            >
                              <option value="" disabled>
                                Profesor
                              </option>
                              {allTeachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="link-action text-left">
                              + Agregar
                            </button>
                          </form>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
