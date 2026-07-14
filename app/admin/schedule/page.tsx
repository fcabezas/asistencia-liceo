import { db } from "@/db";
import { courses, subjects, users, scheduleBlocks } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { createScheduleBlock, updateScheduleBlock, deleteScheduleBlock } from "./actions";

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

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
        .where(eq(scheduleBlocks.courseId, selectedCourseId))
        .orderBy(asc(scheduleBlocks.dayOfWeek), asc(scheduleBlocks.blockNumber))
    : [];

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Horario
      </h1>

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
        <>
          <div className="mt-6 max-w-3xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Día</th>
                  <th className="p-2">Bloque</th>
                  <th className="p-2">Asignatura</th>
                  <th className="p-2">Profesor</th>
                  <th className="p-2">Hora inicio</th>
                  <th className="p-2">Hora fin</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td colSpan={6} className="p-2">
                      <form
                        action={updateScheduleBlock.bind(null, b.id)}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <select
                          name="dayOfWeek"
                          defaultValue={b.dayOfWeek}
                          className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                          required
                        >
                          {Object.entries(DAY_LABELS).map(([v, label]) => (
                            <option key={v} value={v}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <input
                          name="blockNumber"
                          type="number"
                          min={1}
                          defaultValue={b.blockNumber}
                          className="w-16 rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                          required
                        />
                        <select
                          name="subjectId"
                          defaultValue={b.subjectId}
                          className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
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
                          defaultValue={b.teacherId}
                          className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                          required
                        >
                          {allTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <input
                          name="startTime"
                          type="time"
                          defaultValue={b.startTime ?? ""}
                          className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                        />
                        <input
                          name="endTime"
                          type="time"
                          defaultValue={b.endTime ?? ""}
                          className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                        />
                        <button type="submit" className="btn-secondary">
                          Guardar
                        </button>
                      </form>
                    </td>
                    <td className="p-2">
                      <form action={deleteScheduleBlock.bind(null, b.id)}>
                        <button className="btn-danger" type="submit">
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            action={createScheduleBlock}
            className="mt-6 flex max-w-3xl flex-wrap items-end gap-2 text-sm"
          >
            <input type="hidden" name="courseId" value={selectedCourseId} />
            <input type="hidden" name="year" value={currentYear} />
            <div>
              <label className="block text-xs text-zinc-500 dark:text-brand-300">Día</label>
              <select
                name="dayOfWeek"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                required
              >
                {Object.entries(DAY_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-brand-300">Bloque</label>
              <input
                name="blockNumber"
                type="number"
                min={1}
                className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-brand-300">Asignatura</label>
              <select
                name="subjectId"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                required
              >
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-brand-300">Profesor</label>
              <select
                name="teacherId"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
                required
              >
                {allTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-brand-300">Hora inicio</label>
              <input
                name="startTime"
                type="time"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-brand-300">Hora fin</label>
              <input
                name="endTime"
                type="time"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
              />
            </div>
            <button type="submit" className="btn-primary">
              Agregar bloque
            </button>
          </form>
          <p className="mt-2 max-w-3xl text-xs text-zinc-500 dark:text-brand-300">
            La hora de inicio del bloque 1 es obligatoria: se usa para detectar
            cursos donde no se tomó asistencia a tiempo.
          </p>
        </>
      )}
    </div>
  );
}
