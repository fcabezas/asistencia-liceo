import { db } from "@/db";
import { courses, subjects } from "@/db/schema";
import { desc } from "drizzle-orm";
import { createCourse, createSubject, toggleCourseActive } from "./actions";

export default async function CoursesPage() {
  const [allCourses, allSubjects, settings] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.year), courses.name),
    db.select().from(subjects).orderBy(subjects.name),
    db.query.schoolSettings.findFirst(),
  ]);

  const currentYear = settings?.currentYear ?? new Date().getFullYear();

  return (
    <div className="flex flex-col gap-10 p-8">
      <section>
        <h1 className="text-xl font-semibold">Cursos</h1>
        <table className="mt-4 w-full max-w-2xl text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nombre</th>
              <th className="p-2">Nivel</th>
              <th className="p-2">Año</th>
              <th className="p-2">Activo</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {allCourses.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.gradeLevel}</td>
                <td className="p-2">{c.year}</td>
                <td className="p-2">{c.isActive ? "Sí" : "No"}</td>
                <td className="p-2">
                  <form action={toggleCourseActive.bind(null, c.id, !c.isActive)}>
                    <button className="text-blue-600 underline" type="submit">
                      {c.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form action={createCourse} className="mt-4 flex max-w-2xl flex-wrap gap-2">
          <input name="name" placeholder="Nombre (ej. 1ro Medio A)" className="rounded border px-2 py-1" required />
          <input name="gradeLevel" placeholder="Nivel (ej. 1M)" className="rounded border px-2 py-1" required />
          <input
            name="year"
            type="number"
            defaultValue={currentYear}
            className="w-24 rounded border px-2 py-1"
            required
          />
          <button type="submit" className="rounded-md bg-black px-4 py-1 text-white dark:bg-white dark:text-black">
            Crear curso
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Asignaturas</h2>
        <ul className="mt-2 flex max-w-md flex-wrap gap-2 text-sm">
          {allSubjects.map((s) => (
            <li key={s.id} className="rounded-full border px-3 py-1">
              {s.name}
            </li>
          ))}
        </ul>
        <form action={createSubject} className="mt-4 flex max-w-md gap-2">
          <input name="name" placeholder="Nombre de asignatura" className="rounded border px-2 py-1" required />
          <button type="submit" className="rounded-md bg-black px-4 py-1 text-white dark:bg-white dark:text-black">
            Agregar
          </button>
        </form>
      </section>
    </div>
  );
}
