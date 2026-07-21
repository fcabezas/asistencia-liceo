import { db } from "@/db";
import { users, inspectorSubstituteAssignments } from "@/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";
import { chileToday } from "@/lib/date";
import { createInspectorCoverage, cancelInspectorCoverage } from "@/app/inspector/inspector-substitutes/actions";
import { TrashIcon } from "@/components/icons";

export default async function InspectorSubstitutesManager() {
  const { date: today } = chileToday();

  const [pasilloInspectors, coverages] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.role, "inspector_pasillo"), eq(users.isActive, true)))
      .orderBy(asc(users.name)),
    db
      .select()
      .from(inspectorSubstituteAssignments)
      .where(gte(inspectorSubstituteAssignments.endDate, today))
      .orderBy(asc(inspectorSubstituteAssignments.startDate)),
  ]);

  const inspectorName = (id: number) => pasilloInspectors.find((i) => i.id === id)?.name ?? id;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Suplencia entre inspectores</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Cuando un inspector de pasillo está ausente, otro puede cubrir sus cursos por un rango de
        fechas: verá el mismo dashboard de asistencia no tomada y podrá crear justificaciones para
        esos cursos mientras dure la cobertura.
      </p>

      {pasilloInspectors.length < 2 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">
          Necesitas al menos 2 usuarios con rol &quot;inspector_pasillo&quot; activos para
          configurar una cobertura.
        </p>
      ) : (
        <form
          action={createInspectorCoverage}
          className="mt-6 flex max-w-3xl flex-wrap items-end gap-2 text-sm"
        >
          <div>
            <label className="label">Inspector ausente</label>
            <select name="absentInspectorId" className="input" required>
              {pasilloInspectors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Inspector de cobertura</label>
            <select name="substituteInspectorId" className="input" required>
              {pasilloInspectors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input name="startDate" type="date" defaultValue={today} className="input" required />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input name="endDate" type="date" defaultValue={today} className="input" required />
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
              <th className="p-2">Desde</th>
              <th className="p-2">Hasta</th>
              <th className="p-2">Ausente</th>
              <th className="p-2">Cobertura</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {coverages.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.startDate}</td>
                <td className="p-2">{c.endDate}</td>
                <td className="p-2">{inspectorName(c.absentInspectorId)}</td>
                <td className="p-2">{inspectorName(c.substituteInspectorId)}</td>
                <td className="p-2">
                  <form action={cancelInspectorCoverage.bind(null, c.id)}>
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
      {coverages.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">Sin coberturas activas.</p>
      )}
    </div>
  );
}
