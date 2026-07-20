import { db } from "@/db";
import { users, courses, inspectorCourseAssignments } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  createInspectorAssignment,
  deleteInspectorAssignment,
} from "./actions";
import { TrashIcon } from "@/components/icons";

export default async function InspectorAssignmentsPage() {
  const [inspectors, allCourses, assignments] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.role, "inspector_pasillo"), eq(users.isActive, true)))
      .orderBy(asc(users.name)),
    db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.name)),
    db.select().from(inspectorCourseAssignments),
  ]);

  const nameOf = (list: { id: number; name: string }[], id: number) =>
    list.find((x) => x.id === id)?.name ?? id;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Inspectores de pasillo
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Cada inspector de pasillo solo ve y justifica asistencia de los cursos
        que tiene asignados aquí. El inspector general ve todos los cursos sin
        necesidad de asignación.
      </p>

      <div className="mt-6 max-w-xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
        <table className="table w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Inspector</th>
              <th className="p-2">Curso</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{nameOf(inspectors, a.inspectorId)}</td>
                <td className="p-2">{nameOf(allCourses, a.courseId)}</td>
                <td className="p-2">
                  <form action={deleteInspectorAssignment.bind(null, a.id)}>
                    <button className="btn-danger" type="submit">
                      <TrashIcon className="h-3.5 w-3.5" />
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
        action={createInspectorAssignment}
        className="mt-6 flex max-w-xl flex-wrap items-end gap-2 text-sm"
      >
        <div>
          <label className="label">Inspector de pasillo</label>
          <select name="inspectorId" className="input" required>
            {inspectors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Curso</label>
          <select name="courseId" className="input" required>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Asignar
        </button>
      </form>

      {inspectors.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">
          Aún no hay usuarios con rol &quot;inspector_pasillo&quot;: asígnalo
          primero en Usuarios y roles (deben haber iniciado sesión con Google al
          menos una vez).
        </p>
      )}
    </div>
  );
}
