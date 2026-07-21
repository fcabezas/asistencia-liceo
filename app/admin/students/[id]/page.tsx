import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, courses, guardians } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { updateStudent } from "./actions";
import StudentTagsManager from "@/components/StudentTagsManager";

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
          <input name="firstName" defaultValue={student.firstName} className="input mt-1 w-full" required />
        </label>
        <label>
          Apellido
          <input name="lastName" defaultValue={student.lastName} className="input mt-1 w-full" required />
        </label>
        <label>
          Curso
          <select name="courseId" defaultValue={student.courseId} className="input mt-1 w-full" required>
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
          <input name="guardianName" defaultValue={guardian?.fullName} className="input mt-1 w-full" required />
        </label>
        <label>
          Teléfono (WhatsApp)
          <input
            name="guardianPhone"
            defaultValue={guardian?.phoneE164}
            placeholder="+56912345678"
            className="input mt-1 w-full"
            required
          />
        </label>
        <label>
          Email (opcional)
          <input name="guardianEmail" defaultValue={guardian?.email ?? ""} className="input mt-1 w-full" />
        </label>
        <label>
          RUT (opcional)
          <input name="guardianRut" defaultValue={guardian?.rut ?? ""} className="input mt-1 w-full" />
        </label>

        <button type="submit" className="btn-primary mt-2 w-fit">
          Guardar
        </button>
      </form>

      <hr className="my-6 max-w-2xl" />
      <div className="max-w-2xl">
        <StudentTagsManager studentId={studentId} />
      </div>
    </div>
  );
}
