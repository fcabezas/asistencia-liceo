import { db } from "@/db";
import { bellSchedule } from "@/db/schema";
import { upsertBellScheduleBlock } from "./actions";

const GROUPS: { value: "lunes_jueves" | "viernes"; label: string; blocks: number }[] = [
  { value: "lunes_jueves", label: "Lunes a jueves", blocks: 9 },
  { value: "viernes", label: "Viernes", blocks: 6 },
];

export default async function BellSchedulePage() {
  const rows = await db.select().from(bellSchedule);
  const byKey = new Map(rows.map((r) => [`${r.dayGroup}-${r.blockNumber}`, r]));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Horas de bloque
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Define una sola vez la hora de inicio y fin de cada bloque de 45
        minutos. Estas horas se usan automáticamente al armar el horario de
        cada curso, así no hay que escribirlas de nuevo en cada bloque.
      </p>

      {GROUPS.map((group) => (
        <div key={group.value} className="mt-8 max-w-xl">
          <h2 className="text-sm font-semibold text-brand-900 dark:text-white">
            {group.label}
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Bloque</th>
                  <th className="p-2">Hora inicio</th>
                  <th className="p-2">Hora fin</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: group.blocks }, (_, i) => i + 1).map((blockNumber) => {
                  const existing = byKey.get(`${group.value}-${blockNumber}`);
                  return (
                    <tr key={blockNumber} className="border-b">
                      <td className="p-2">{blockNumber}</td>
                      <td colSpan={3} className="p-2">
                        <form
                          action={upsertBellScheduleBlock}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="dayGroup" value={group.value} />
                          <input type="hidden" name="blockNumber" value={blockNumber} />
                          <input
                            name="startTime"
                            type="time"
                            defaultValue={existing?.startTime ?? ""}
                            className="input"
                            required
                          />
                          <input
                            name="endTime"
                            type="time"
                            defaultValue={existing?.endTime ?? ""}
                            className="input"
                            required
                          />
                          <button type="submit" className="btn-secondary">
                            Guardar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
