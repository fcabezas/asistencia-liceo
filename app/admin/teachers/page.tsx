import { db } from "@/db";
import { users, courses, subjects, teacherCourseSubjects } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { createTeacherAssignment, deleteTeacherAssignment } from "./actions";

export default async function TeachersPage() {
  const [teachers, allCourses, allSubjects, assignments, settings] =
    await Promise.all([
      db
        .select()
        .from(users)
        .where(and(inArray(users.role, ["teacher", "admin"]), eq(users.isActive, true)))
        .orderBy(asc(users.name)),
      db
        .select()
        .from(courses)
        .where(eq(courses.isActive, true))
        .orderBy(asc(courses.name)),
      db.select().from(subjects).orderBy(asc(subjects.name)),
      db.select().from(teacherCourseSubjects),
      db.query.schoolSettings.findFirst(),
    ]);

  const currentYear = settings?.currentYear ?? new Date().getFullYear();

  const nameOf = (list: { id: number; name: string }[], id: number) =>
    list.find((x) => x.id === id)?.name ?? id;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Profesores y asignaciones
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Define qué profesor dicta qué asignatura en qué curso. Esto determina
        qué cursos ve cada profesor para pasar asistencia. Los profesores se
        crean automáticamente en su primer login con Google.
      </p>

      <div className="mt-6 max-w-3xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Profesor</th>
              <th className="p-2">Curso</th>
              <th className="p-2">Asignatura</th>
              <th className="p-2">Año</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{nameOf(teachers, a.teacherId)}</td>
                <td className="p-2">{nameOf(allCourses, a.courseId)}</td>
                <td className="p-2">{nameOf(allSubjects, a.subjectId)}</td>
                <td className="p-2">{a.year}</td>
                <td className="p-2">
                  <form action={deleteTeacherAssignment.bind(null, a.id)}>
                    <button className="btn-danger" type="submit">
                      Quitar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={createTeacherAssignment}
        className="mt-6 flex max-w-3xl flex-wrap items-end gap-2 text-sm"
      >
        <input type="hidden" name="year" value={currentYear} />
        <div>
          <label className="block text-xs text-zinc-500 dark:text-brand-300">Profesor</label>
          <select
            name="teacherId"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
            required
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-brand-300">Curso</label>
          <select name="courseId" className="rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" required>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
        <button type="submit" className="btn-primary">
          Asignar
        </button>
      </form>

      {teachers.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">
          Aún no hay profesores registrados: deben iniciar sesión con Google al
          menos una vez para aparecer aquí.
        </p>
      )}
    </div>
  );
}
