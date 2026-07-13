import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, courses, guardians } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { updateStudent } from "./actions";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);

  const [student, allCourses] = await Promise.all([
    db.query.students.findFirst({ where: eq(students.id, studentId) }),
    db.select().from(courses).where(eq(courses.isActive, true)).orderBy(asc(courses.name)),
  ]);

  if (!student) notFound();

  const guardian = student.guardianId
    ? await db.query.guardians.findFirst({ where: eq(guardians.id, student.guardianId) })
    : null;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Editar {student.firstName} {student.lastName}
      </h1>

      <form action={updateStudent.bind(null, studentId)} className="mt-6 flex max-w-md flex-col gap-3 text-sm">
        <label>
          Nombre
          <input name="firstName" defaultValue={student.firstName} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" required />
        </label>
        <label>
          Apellido
          <input name="lastName" defaultValue={student.lastName} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" required />
        </label>
        <label>
          Curso
          <select name="courseId" defaultValue={student.courseId} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" required>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <hr className="my-2" />
        <p className="font-medium">Apoderado titular</p>

        <label>
          Nombre
          <input name="guardianName" defaultValue={guardian?.fullName} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" required />
        </label>
        <label>
          Teléfono (WhatsApp)
          <input
            name="guardianPhone"
            defaultValue={guardian?.phoneE164}
            placeholder="+56912345678"
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900"
            required
          />
        </label>
        <label>
          Email (opcional)
          <input name="guardianEmail" defaultValue={guardian?.email ?? ""} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" />
        </label>
        <label>
          RUT (opcional)
          <input name="guardianRut" defaultValue={guardian?.rut ?? ""} className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-brand-700 dark:bg-brand-900" />
        </label>

        <button type="submit" className="btn-primary mt-2 w-fit">
          Guardar
        </button>
      </form>
    </div>
  );
}
