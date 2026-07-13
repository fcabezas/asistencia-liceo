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
              ilike(students.identifier, `%${q}%`)
            )
          : undefined
      )
    )
    .orderBy(asc(students.lastName), asc(students.firstName))
    .limit(200);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Estudiantes</h1>

      <form method="get" className="mt-4 flex gap-2 text-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o identificador..."
          className="w-72 rounded border px-2 py-1"
        />
        <button type="submit" className="rounded border px-3 py-1">
          Buscar
        </button>
      </form>

      <table className="mt-6 w-full max-w-3xl text-left text-sm">
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
                <span className="text-zinc-500">{r.guardianPhone}</span>
              </td>
              <td className="p-2">
                <Link href={`/admin/students/${r.id}`} className="text-blue-600 underline">
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && <p className="mt-4 text-sm text-zinc-500">Sin resultados.</p>}
    </div>
  );
}
