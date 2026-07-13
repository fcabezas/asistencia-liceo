import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFailedNotifications } from "@/lib/notifications-report";
import { retryNotification } from "@/app/admin/notifications/actions";

export default async function InspectorFailedNotificationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "inspector_general") {
    redirect("/inspector/dashboard");
  }

  const rows = await getFailedNotifications();

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Notificaciones fallidas</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No hay notificaciones fallidas pendientes.</p>
      ) : (
        <table className="mt-6 w-full max-w-4xl text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Fecha</th>
              <th className="p-2">Estudiante</th>
              <th className="p-2">Curso</th>
              <th className="p-2">Apoderado</th>
              <th className="p-2">Intentos</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.queueId} className="border-b bg-red-50 dark:bg-red-950/40">
                <td className="p-2">{r.date}</td>
                <td className="p-2">
                  {r.studentFirstName} {r.studentLastName}
                </td>
                <td className="p-2">{r.courseName}</td>
                <td className="p-2">
                  {r.guardianName ?? "Sin apoderado"}
                  <br />
                  <span className="text-zinc-500">{r.guardianPhone}</span>
                </td>
                <td className="p-2">{r.attempts}</td>
                <td className="p-2">
                  <form action={retryNotification.bind(null, r.queueId)}>
                    <button className="text-blue-600 underline" type="submit">
                      Reintentar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
