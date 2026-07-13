import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DirectorReports() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "director" && role !== "admin")) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Reportes de asistencia</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Vista de solo lectura con estadísticas agregadas por curso y periodo (Fase 5).
      </p>
    </div>
  );
}
