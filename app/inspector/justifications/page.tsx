import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { students, courses } from "@/db/schema";
import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { getScopedCourses } from "@/lib/inspector-scope";

export default async function JustificationsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  const { q } = await searchParams;
  const inspectorId = Number(session.user.id);
  const scopedCourses = await getScopedCourses(role, inspectorId);
  const courseIds = scopedCourses.map((c) => c.id);

  const rows =
    q && courseIds.length
      ? await db
          .select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            identifier: students.identifier,
            courseName: courses.name,
          })
          .from(students)
          .innerJoin(courses, eq(students.courseId, courses.id))
          .where(
            and(
              eq(students.isActive, true),
              inArray(students.courseId, courseIds),
              or(
                ilike(students.firstName, `%${q}%`),
                ilike(students.lastName, `%${q}%`),
                ilike(students.identifier, `%${q}%`)
              )
            )
          )
          .orderBy(asc(students.lastName))
          .limit(50)
      : [];

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Justificaciones</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Busca un estudiante para registrar una justificación de inasistencia o
        atraso. Queda registro de quién la creó, el motivo y el rango de días
        que cubre.
      </p>

      <form method="get" className="mt-4 flex gap-2 text-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o identificador..."
          className="input w-72"
        />
        <button type="submit" className="btn-secondary">
          Buscar
        </button>
      </form>

      {q && rows.length === 0 && <p className="mt-4 text-sm text-zinc-500 dark:text-brand-300">Sin resultados.</p>}

      <ul className="mt-6 flex max-w-xl flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-brand-800 dark:border-brand-800">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              {r.lastName}, {r.firstName} · {r.courseName} · {r.identifier}
            </span>
            <Link href={`/inspector/justifications/${r.id}`} className="link-action">
              Justificar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
