import { db } from "@/db";
import { courses, subjects, users, scheduleBlocks } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { createScheduleBlock, deleteScheduleBlock } from "./actions";

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
    db.select().from(courses).where(eq(courses.isActive, true)).orderBy(asc(courses.name)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db.select().from(users).where(and(eq(users.role, "teacher"), eq(users.isActive, true))),
    db.query.schoolSettings.findFirst(),
  ]);

  const currentYear = settings?.currentYear ?? new Date().getFullYear();
  const selectedCourseId = courseIdParam ? Number(courseIdParam) : allCourses[0]?.id;

  const blocks = selectedCourseId
    ? await db
        .select()
        .from(scheduleBlocks)
        .where(eq(scheduleBlocks.courseId, selectedCourseId))
        .orderBy(asc(scheduleBlocks.dayOfWeek), asc(scheduleBlocks.blockNumber))
    : [];

  const subjectName = (id: number) => allSubjects.find((s) => s.id === id)?.name ?? id;
  const teacherName = (id: number) => allTeachers.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Horario</h1>

      <form method="get" className="mt-4 flex items-center gap-2 text-sm">
        <label htmlFor="courseId">Curso:</label>
        <select
          id="courseId"
          name="courseId"
          defaultValue={selectedCourseId}
          className="rounded border px-2 py-1"
        >
          {allCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border px-2 py-1">
          Ver
        </button>
      </form>

      {selectedCourseId && (
        <>
          <table className="mt-6 w-full max-w-3xl text-left text-sm">
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
                  <td className="p-2">{DAY_LABELS[b.dayOfWeek]}</td>
                  <td className="p-2">{b.blockNumber}</td>
                  <td className="p-2">{subjectName(b.subjectId)}</td>
                  <td className="p-2">{teacherName(b.teacherId)}</td>
                  <td className="p-2">{b.startTime}</td>
                  <td className="p-2">{b.endTime}</td>
                  <td className="p-2">
                    <form action={deleteScheduleBlock.bind(null, b.id)}>
                      <button className="text-red-600 underline" type="submit">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form action={createScheduleBlock} className="mt-6 flex max-w-3xl flex-wrap items-end gap-2 text-sm">
            <input type="hidden" name="courseId" value={selectedCourseId} />
            <input type="hidden" name="year" value={currentYear} />
            <div>
              <label className="block text-xs text-zinc-500">Día</label>
              <select name="dayOfWeek" className="rounded border px-2 py-1" required>
                {Object.entries(DAY_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Bloque</label>
              <input name="blockNumber" type="number" min={1} className="w-20 rounded border px-2 py-1" required />
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Asignatura</label>
              <select name="subjectId" className="rounded border px-2 py-1" required>
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Profesor</label>
              <select name="teacherId" className="rounded border px-2 py-1" required>
                {allTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Hora inicio</label>
              <input name="startTime" type="time" className="rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Hora fin</label>
              <input name="endTime" type="time" className="rounded border px-2 py-1" />
            </div>
            <button type="submit" className="rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
              Agregar bloque
            </button>
          </form>
          <p className="mt-2 max-w-3xl text-xs text-zinc-500">
            La hora de inicio del bloque 1 es obligatoria: se usa para detectar
            cursos donde no se tomó asistencia a tiempo.
          </p>
        </>
      )}
    </div>
  );
}
