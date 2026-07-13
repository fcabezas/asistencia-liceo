import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Administración</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Gestión de estudiantes, cursos, horario, asignaciones y usuarios (Fase 2).
      </p>
    </div>
  );
}
