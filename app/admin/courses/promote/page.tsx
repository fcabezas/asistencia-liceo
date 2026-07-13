import { db } from "@/db";
import { courses } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import PromoteForm from "@/components/PromoteForm";

export default async function PromoteCoursesPage() {
  const allCourses = await db
    .select()
    .from(courses)
    .orderBy(desc(courses.year), asc(courses.name));

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Promoción de curso (cambio de año)</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Mueve a todos los estudiantes activos de un curso a otro (ej. de
        &quot;1ro Medio A 2026&quot; a &quot;2do Medio A 2027&quot;). Crea
        primero el curso de destino en la sección Cursos si no existe.
      </p>

      {allCourses.length < 2 ? (
        <p className="mt-6 text-sm text-zinc-500">Necesitas al menos dos cursos creados.</p>
      ) : (
        <div className="mt-6">
          <PromoteForm courses={allCourses} />
        </div>
      )}
    </div>
  );
}
