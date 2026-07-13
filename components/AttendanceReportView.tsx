import { db } from "@/db";
import { courses } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getAttendanceSummary } from "@/lib/reports";

function defaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

export default async function AttendanceReportView({
  searchParams,
}: {
  searchParams: { courseId?: string; startDate?: string; endDate?: string };
}) {
  const allCourses = await db.select().from(courses).orderBy(asc(courses.name));
  const defaults = defaultDateRange();

  const courseId = searchParams.courseId ? Number(searchParams.courseId) : allCourses[0]?.id;
  const startDate = searchParams.startDate || defaults.start;
  const endDate = searchParams.endDate || defaults.end;

  const summary = courseId ? await getAttendanceSummary(courseId, startDate, endDate) : [];

  return (
    <div>
      <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
        <div>
          <label className="block text-xs text-zinc-500">Curso</label>
          <select name="courseId" defaultValue={courseId} className="rounded border px-2 py-1">
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Desde</label>
          <input type="date" name="startDate" defaultValue={startDate} className="rounded border px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Hasta</label>
          <input type="date" name="endDate" defaultValue={endDate} className="rounded border px-2 py-1" />
        </div>
        <button type="submit" className="rounded border px-3 py-1">
          Ver
        </button>
      </form>

      <p className="mt-2 text-xs text-zinc-500">
        Conteo basado en la asistencia de bloque 1 (la que dispara avisos a
        los apoderados), no incluye el detalle de bloques posteriores.
      </p>

      <table className="mt-4 w-full max-w-2xl text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Estudiante</th>
            <th className="p-2">Presente</th>
            <th className="p-2">Ausente</th>
            <th className="p-2">Atraso</th>
            <th className="p-2">Justificado</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">
                {s.lastName}, {s.firstName}
              </td>
              <td className="p-2">{s.presente}</td>
              <td className="p-2">{s.ausente}</td>
              <td className="p-2">{s.atraso}</td>
              <td className="p-2">{s.justificado}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {summary.length === 0 && <p className="mt-4 text-sm text-zinc-500">Sin datos para mostrar.</p>}
    </div>
  );
}
