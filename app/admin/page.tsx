import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Administración</h1>
      <p className="mt-2 text-zinc-600 dark:text-brand-300">
        Gestión de estudiantes, cursos, horario, asignaciones y usuarios.
      </p>
    </div>
  );
}
