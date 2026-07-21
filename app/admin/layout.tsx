import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import {
  HomeIcon,
  ClipboardCheckIcon,
  UsersIcon,
  UploadIcon,
  BookIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  SwapIcon,
  ShieldIcon,
  KeyIcon,
  BellAlertIcon,
  BarChartIcon,
  LogOutIcon,
} from "@/components/icons";

const iconClass = "shrink-0";

const links = [
  { href: "/admin", label: "Inicio", icon: <HomeIcon className={iconClass} /> },
  { href: "/dashboard", label: "Pasar asistencia (mis cursos)", icon: <ClipboardCheckIcon className={iconClass} /> },
  { href: "/admin/students", label: "Estudiantes", icon: <UsersIcon className={iconClass} /> },
  { href: "/admin/students/import", label: "Importar CSV", icon: <UploadIcon className={iconClass} /> },
  { href: "/admin/courses", label: "Cursos y asignaturas", icon: <BookIcon className={iconClass} /> },
  { href: "/admin/courses/promote", label: "Promoción de curso", icon: <TrendingUpIcon className={iconClass} /> },
  { href: "/admin/schedule", label: "Horario", icon: <CalendarIcon className={iconClass} /> },
  { href: "/admin/bell-schedule", label: "Horas de bloque", icon: <ClockIcon className={iconClass} /> },
  { href: "/admin/teachers", label: "Profesores y asignaciones", icon: <BriefcaseIcon className={iconClass} /> },
  { href: "/admin/substitutes", label: "Reemplazos", icon: <SwapIcon className={iconClass} /> },
  { href: "/admin/exits", label: "Retiros", icon: <LogOutIcon className={iconClass} /> },
  { href: "/admin/inspector-assignments", label: "Inspectores de pasillo", icon: <ShieldIcon className={iconClass} /> },
  { href: "/admin/users", label: "Usuarios y roles", icon: <KeyIcon className={iconClass} /> },
  { href: "/admin/notifications", label: "Notificaciones fallidas", icon: <BellAlertIcon className={iconClass} /> },
  { href: "/admin/reports", label: "Reportes", icon: <BarChartIcon className={iconClass} /> },
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
