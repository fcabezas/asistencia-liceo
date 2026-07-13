import Link from "next/link";
import { db } from "@/db";
import { students, courses, guardians } from "@/db/schema";
import { and, asc, eq, ilike, or } from "drizzle-orm";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const rows = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      identifier: students.identifier,
      courseName: courses.name,
      guardianName: guardians.fullName,
      guardianPhone: guardians.phoneE164,
    })
    .from(students)
    .leftJoin(courses, eq(students.courseId, courses.id))
    .leftJoin(guardians, eq(students.guardianId, guardians.id))
    .where(
      and(
        eq(students.isActive, true),
        q
          ? or(
              ilike(students.firstName, `%${q}%`),
              ilike(students.lastName, `%${q}%`),
              ilike(students.identifier, `%${q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(students.lastName), asc(students.firstName))
    .limit(200);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Estudiantes
      </h1>

      <form method="get" className="mt-4 flex gap-2 text-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o identificador..."
          className="w-72 rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
        />
        <button type="submit" className="btn-secondary">
          Buscar
        </button>
      </form>

      <div className="mt-6 max-w-3xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nombre</th>
              <th className="p-2">Identificador</th>
              <th className="p-2">Curso</th>
              <th className="p-2">Apoderado</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">
                  {r.firstName} {r.lastName}
                </td>
                <td className="p-2">{r.identifier}</td>
                <td className="p-2">{r.courseName}</td>
                <td className="p-2">
                  {r.guardianName}
                  <br />
                  <span className="text-zinc-500 dark:text-brand-400">{r.guardianPhone}</span>
                </td>
                <td className="p-2">
                  <Link
                    href={`/admin/students/${r.id}`}
                    className="link-action"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">Sin resultados.</p>
      )}
    </div>
  );
}
