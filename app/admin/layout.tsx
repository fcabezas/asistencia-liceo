import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const links = [
  { href: "/admin", label: "Inicio" },
  { href: "/dashboard", label: "Pasar asistencia (mis cursos)" },
  { href: "/admin/students", label: "Estudiantes" },
  { href: "/admin/students/import", label: "Importar CSV" },
  { href: "/admin/courses", label: "Cursos y asignaturas" },
  { href: "/admin/courses/promote", label: "Promoción de curso" },
  { href: "/admin/schedule", label: "Horario" },
  { href: "/admin/bell-schedule", label: "Horas de bloque" },
  { href: "/admin/teachers", label: "Profesores y asignaciones" },
  { href: "/admin/inspector-assignments", label: "Inspectores de pasillo" },
  { href: "/admin/users", label: "Usuarios y roles" },
  { href: "/admin/notifications", label: "Notificaciones fallidas" },
  { href: "/admin/reports", label: "Reportes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return (
    <DashboardShell title="Administración" links={links}>
      {children}
    </DashboardShell>
  );
}
