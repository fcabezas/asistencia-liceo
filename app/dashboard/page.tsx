import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Mis bloques de hoy</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Hola {session.user.name}. Aquí aparecerán los cursos y bloques que tienes
        asignados hoy para pasar asistencia.
      </p>
    </div>
  );
}
