import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InspectorDashboard() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Panel de inspectoría</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Aquí aparecerá el estado de asistencia de bloque 1 por curso y el acceso a
        justificaciones (Fase 3).
      </p>
    </div>
  );
}
