import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getScopedCourses } from "@/lib/inspector-scope";
import { getPendingNotifications } from "@/lib/pending-notifications";
import { markAsNotified } from "./actions";

export default async function PendingNotificationsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  const inspectorId = Number(session.user.id);
  const scopedCourses = await getScopedCourses(role, inspectorId);
  const courseIds = scopedCourses.map((c) => c.id);
  const pending = await getPendingNotifications(courseIds);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Avisos pendientes</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Estudiantes ausentes o atrasados que aún no han sido avisados por
        WhatsApp. Haz clic en &quot;Enviar WhatsApp&quot; para abrir el chat
        con el apoderado con el mensaje ya escrito, y luego marca como
        avisado.
      </p>

      {pending.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-brand-300">
          No hay avisos pendientes por ahora.
        </p>
      ) : (
        <ul className="mt-6 flex max-w-2xl flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-brand-800 dark:border-brand-800">
          {pending.map((p) => (
            <li
              key={p.queueId}
              className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-brand-900 dark:text-white">
                  {p.studentLastName}, {p.studentFirstName} · {p.courseName}
                </p>
                <p className="text-zinc-500 dark:text-brand-300">
                  {p.date} ·{" "}
                  <span
                    className={
                      p.status === "ausente"
                        ? "font-medium text-red-700 dark:text-red-300"
                        : p.status === "atraso"
                          ? "font-medium text-gold-700 dark:text-gold-400"
                          : ""
                    }
                  >
                    {p.status}
                  </span>
                  {p.kind === "correccion" && " (corrección)"}
                </p>
                <p className="text-zinc-500 dark:text-brand-300">
                  {p.guardianName ?? "Sin apoderado"}
                  {p.guardianPhone ? ` · ${p.guardianPhone}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Enviar WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-red-700 dark:text-red-300">
                    Sin teléfono de apoderado
                  </span>
                )}
                <form action={markAsNotified.bind(null, p.queueId)}>
                  <button type="submit" className="btn-secondary">
                    Marcar como avisado
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
