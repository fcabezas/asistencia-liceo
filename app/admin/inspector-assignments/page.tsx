import { db } from "@/db";
import { users, courses, inspectorCourseAssignments } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { createInspectorAssignment, deleteInspectorAssignment } from "./actions";

export default async function InspectorAssignmentsPage() {
  const [inspectors, allCourses, assignments] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.role, "inspector_pasillo"), eq(users.isActive, true)))
      .orderBy(asc(users.name)),
    db.select().from(courses).where(eq(courses.isActive, true)).orderBy(asc(courses.name)),
    db.select().from(inspectorCourseAssignments),
  ]);

  const nameOf = (list: { id: number; name: string }[], id: number) =>
    list.find((x) => x.id === id)?.name ?? id;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Inspectores de pasillo</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Cada inspector de pasillo solo ve y justifica asistencia de los cursos
        que tiene asignados aquí. El inspector general ve todos los cursos sin
        necesidad de asignación.
      </p>

      <table className="mt-6 w-full max-w-xl text-left text-sm">
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
                  <button className="text-red-600 underline" type="submit">
                    Quitar
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={createInspectorAssignment} className="mt-6 flex max-w-xl flex-wrap items-end gap-2 text-sm">
        <div>
          <label className="block text-xs text-zinc-500">Inspector de pasillo</label>
          <select name="inspectorId" className="rounded border px-2 py-1" required>
            {inspectors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Curso</label>
          <select name="courseId" className="rounded border px-2 py-1" required>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
          Asignar
        </button>
      </form>

      {inspectors.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          Aún no hay usuarios con rol &quot;inspector_pasillo&quot;: asígnalo
          primero en Usuarios y roles (deben haber iniciado sesión con Google
          al menos una vez).
        </p>
      )}
    </div>
  );
}
