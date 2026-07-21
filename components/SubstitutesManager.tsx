import { db } from "@/db";
import { users, substituteAssignments } from "@/db/schema";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { getScopedCourses } from "@/lib/inspector-scope";
import { chileToday } from "@/lib/date";
import { activateSubstitute, cancelSubstitute } from "@/app/inspector/substitutes/actions";
import { TrashIcon } from "@/components/icons";

const SUBSTITUTE_ROLES = ["pie", "inspector_general", "inspector_pasillo"] as const;

const ROLE_LABELS: Record<string, string> = {
  pie: "PIE",
  inspector_general: "Inspector general",
  inspector_pasillo: "Inspector de pasillo",
};

export default async function SubstitutesManager({
  role,
  userId,
}: {
  role: string;
  userId: number;
}) {
  const { date: today } = chileToday();

  const [scopedCourses, candidates] = await Promise.all([
    getScopedCourses(role, userId),
    db
      .select()
      .from(users)
      .where(and(inArray(users.role, SUBSTITUTE_ROLES), eq(users.isActive, true)))
      .orderBy(asc(users.name)),
  ]);

  const courseIds = scopedCourses.map((c) => c.id);

  const activeAssignments = courseIds.length
    ? await db
        .select({
          id: substituteAssignments.id,
          courseId: substituteAssignments.courseId,
          blockNumber: substituteAssignments.blockNumber,
          date: substituteAssignments.date,
          substituteTeacherId: substituteAssignments.substituteTeacherId,
        })
        .from(substituteAssignments)
        .where(
          and(
            inArray(substituteAssignments.courseId, courseIds),
            gte(substituteAssignments.date, today)
          )
        )
        .orderBy(asc(substituteAssignments.date), asc(substituteAssignments.blockNumber))
    : [];

  const courseName = (id: number) =>
    scopedCourses.find((c) => c.id === id)?.name ?? id;
  const candidateName = (id: number) => {
    const c = candidates.find((p) => p.id === id);
    return c ? `${c.name} (${ROLE_LABELS[c.role] ?? c.role})` : id;
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Reemplazos
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Activa a una persona de PIE o a un inspector para cubrir un bloque
        puntual cuando falte el profesor habitual. No modifica el horario
        fijo: solo habilita ese bloque, ese día, para esa persona.
      </p>

      {scopedCourses.length === 0 ? (
        <p className="mt-4 text-zinc-600 dark:text-brand-300">
          No hay cursos disponibles todavía.
        </p>
      ) : candidates.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">
          Aún no hay usuarios con rol PIE o inspector: agrégalos primero en
          Usuarios y roles (deben haber iniciado sesión con Google al menos
          una vez).
        </p>
      ) : (
        <form
          action={activateSubstitute}
          className="mt-6 flex max-w-3xl flex-wrap items-end gap-2 text-sm"
        >
          <div>
            <label className="label">Curso</label>
            <select name="courseId" className="input" required>
              {scopedCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bloque</label>
            <input
              name="blockNumber"
              type="number"
              min={1}
              max={9}
              className="input w-20"
              required
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input
              name="date"
              type="date"
              defaultValue={today}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Reemplazo</label>
            <select name="substituteTeacherId" className="input" required>
              {candidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({ROLE_LABELS[p.role] ?? p.role})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Activar
          </button>
        </form>
      )}

      <div className="mt-8 max-w-3xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
        <table className="table w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Fecha</th>
              <th className="p-2">Bloque</th>
              <th className="p-2">Curso</th>
              <th className="p-2">Reemplazo</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {activeAssignments.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{a.date}</td>
                <td className="p-2">{a.blockNumber}</td>
                <td className="p-2">{courseName(a.courseId)}</td>
                <td className="p-2">{candidateName(a.substituteTeacherId)}</td>
                <td className="p-2">
                  <form action={cancelSubstitute.bind(null, a.id)}>
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
      {activeAssignments.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">
          Sin reemplazos activos.
        </p>
      )}
    </div>
  );
}
