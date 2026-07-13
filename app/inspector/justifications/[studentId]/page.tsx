import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { students, courses, justifications, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { canInspectStudent } from "@/lib/justifications";
import { createJustificationAction } from "./actions";

export default async function StudentJustificationPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  const { studentId: studentIdParam } = await params;
  const studentId = Number(studentIdParam);
  const inspectorId = Number(session.user.id);

  const allowed = await canInspectStudent(role, inspectorId, studentId);
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
    <div className="p-8">
      <h1 className="text-xl font-semibold">
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
            className="mt-1 w-full rounded border px-2 py-1"
            placeholder="Ej. Certificado médico por gripe"
          />
        </label>
        <label>
          Fecha de inicio
          <input name="startDate" type="date" required className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label>
          Cantidad de días que faltará
          <input
            name="days"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <button type="submit" className="mt-2 w-fit rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
          Registrar justificación
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold">Historial</h2>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">Sin justificaciones registradas.</p>
      ) : (
        <table className="mt-4 w-full max-w-2xl text-left text-sm">
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
      )}
    </div>
  );
}
