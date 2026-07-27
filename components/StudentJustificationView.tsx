import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, courses, justifications, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { canInspectStudent } from "@/lib/justifications";
import { createJustificationAction } from "@/app/inspector/justifications/[studentId]/actions";

export default async function StudentJustificationView({
  studentId,
  role,
  userId,
}: {
  studentId: number;
  role: string;
  userId: number;
}) {
  const allowed = await canInspectStudent(role, userId, studentId);
  if (!allowed) notFound();

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student) notFound();

  const course = await db.query.courses.findFirst({ where: eq(courses.id, student.courseId) });

  const history = await db
    .select({
      id: justifications.id,
      reason: justifications.reason,
      startDate: justifications.startDate,
      endDate: justifications.endDate,
      createdAt: justifications.createdAt,
      createdByName: users.name,
    })
    .from(justifications)
    .innerJoin(users, eq(justifications.createdBy, users.id))
    .where(eq(justifications.studentId, studentId))
    .orderBy(desc(justifications.startDate));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        {student.firstName} {student.lastName} · {course?.name}
      </h1>

      <form
        action={createJustificationAction.bind(null, studentId)}
        className="mt-6 flex max-w-md flex-col gap-3 text-sm"
      >
        <label>
          Motivo
          <textarea
            name="reason"
            required
            className="input mt-1 w-full"
            placeholder="Ej. Certificado médico por gripe"
          />
        </label>
        <label>
          Fecha de inicio
          <input name="startDate" type="date" required className="input mt-1 w-full" />
        </label>
        <label>
          Cantidad de días que faltará
          <input
            name="days"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="input mt-1 w-full"
          />
        </label>
        <button type="submit" className="btn-primary mt-2 w-fit">
          Registrar justificación
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold">Historial</h2>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-brand-300">
          Sin justificaciones registradas.
        </p>
      ) : (
        <div className="mt-4 max-w-2xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
          <table className="table w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Desde</th>
                <th className="p-2">Hasta</th>
                <th className="p-2">Motivo</th>
                <th className="p-2">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="p-2">{h.startDate}</td>
                  <td className="p-2">{h.endDate}</td>
                  <td className="p-2">{h.reason}</td>
                  <td className="p-2">{h.createdByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
