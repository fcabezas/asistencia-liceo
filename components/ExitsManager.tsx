import { db } from "@/db";
import { students, courses, studentExits } from "@/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getScopedCourses } from "@/lib/inspector-scope";
import { chileToday } from "@/lib/date";
import { registerExit, cancelExit } from "@/app/inspector/exits/actions";
import { TrashIcon } from "@/components/icons";

export default async function ExitsManager({
  role,
  userId,
}: {
  role: string;
  userId: number;
}) {
  const { date: today } = chileToday();

  const scopedCourses = await getScopedCourses(role, userId);
  const courseIds = scopedCourses.map((c) => c.id);

  const [scopedStudents, todayExits] = await Promise.all([
    courseIds.length
      ? db
          .select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            courseId: students.courseId,
            courseName: courses.name,
          })
          .from(students)
          .innerJoin(courses, eq(students.courseId, courses.id))
          .where(and(eq(students.isActive, true), inArray(students.courseId, courseIds)))
          .orderBy(asc(courses.name), asc(students.lastName), asc(students.firstName))
      : [],
    courseIds.length
      ? db
          .select({
            id: studentExits.id,
            studentId: studentExits.studentId,
            exitTime: studentExits.exitTime,
            reason: studentExits.reason,
          })
          .from(studentExits)
          .innerJoin(students, eq(studentExits.studentId, students.id))
          .where(and(eq(studentExits.date, today), inArray(students.courseId, courseIds)))
          .orderBy(desc(studentExits.exitTime))
      : [],
  ]);

  const studentInfo = (id: number) => scopedStudents.find((s) => s.id === id);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Retiros</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Registro interno de retiro anticipado durante la jornada. No se envía
        ningún aviso al apoderado — queda visible aquí y como nota para los
        profesores de bloques posteriores de ese estudiante.
      </p>

      {scopedCourses.length === 0 ? (
        <p className="mt-4 text-zinc-600 dark:text-brand-300">No hay cursos disponibles todavía.</p>
      ) : scopedStudents.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">No hay estudiantes en tus cursos todavía.</p>
      ) : (
        <form action={registerExit} className="mt-6 flex max-w-3xl flex-wrap items-end gap-2 text-sm">
          <div>
            <label className="label">Estudiante</label>
            <select name="studentId" className="input" required>
              {scopedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lastName}, {s.firstName} — {s.courseName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input name="date" type="date" defaultValue={today} className="input" required />
          </div>
          <div>
            <label className="label">Hora de retiro</label>
            <input name="exitTime" type="time" className="input" required />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input name="reason" type="text" placeholder="Ej. consulta médica" className="input" required />
          </div>
          <button type="submit" className="btn-primary">
            Registrar
          </button>
        </form>
      )}

      <div className="mt-8 max-w-3xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
        <table className="table w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Hora</th>
              <th className="p-2">Estudiante</th>
              <th className="p-2">Curso</th>
              <th className="p-2">Motivo</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {todayExits.map((e) => {
              const info = studentInfo(e.studentId);
              return (
                <tr key={e.id} className="border-b">
                  <td className="p-2">{e.exitTime}</td>
                  <td className="p-2">
                    {info ? `${info.lastName}, ${info.firstName}` : e.studentId}
                  </td>
                  <td className="p-2">{info?.courseName ?? "—"}</td>
                  <td className="p-2">{e.reason}</td>
                  <td className="p-2">
                    <form action={cancelExit.bind(null, e.id)}>
                      <button className="btn-danger" type="submit">
                        <TrashIcon className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {todayExits.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">Sin retiros registrados hoy.</p>
      )}
    </div>
  );
}
