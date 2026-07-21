import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import {
  AlertCircleIcon,
  ChatIcon,
  FileCheckIcon,
  SwapIcon,
  BellAlertIcon,
  BarChartIcon,
  LogOutIcon,
  TagIcon,
  ClipboardCheckIcon,
  UserSwapIcon,
} from "@/components/icons";

export default async function InspectorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  const iconClass = "shrink-0";

  const links = [
    { href: "/inspector/dashboard", label: "Asistencia no tomada", icon: <AlertCircleIcon className={iconClass} /> },
    { href: "/inspector/pending", label: "Avisos pendientes", icon: <ChatIcon className={iconClass} /> },
    { href: "/inspector/justifications", label: "Justificaciones", icon: <FileCheckIcon className={iconClass} /> },
    { href: "/inspector/substitutes", label: "Reemplazos", icon: <SwapIcon className={iconClass} /> },
    { href: "/dashboard", label: "Pasar asistencia (reemplazo)", icon: <ClipboardCheckIcon className={iconClass} /> },
    { href: "/inspector/exits", label: "Retiros", icon: <LogOutIcon className={iconClass} /> },
    ...(role === "inspector_general"
      ? [
          { href: "/inspector/students", label: "Etiquetas", icon: <TagIcon className={iconClass} /> },
          {
            href: "/inspector/inspector-substitutes",
            label: "Suplencia entre inspectores",
            icon: <UserSwapIcon className={iconClass} />,
          },
          { href: "/inspector/notifications", label: "Notificaciones fallidas", icon: <BellAlertIcon className={iconClass} /> },
          { href: "/inspector/reports", label: "Reportes", icon: <BarChartIcon className={iconClass} /> },
        ]
      : []),
  ];

  return (
    <DashboardShell title="Inspectoría" links={links}>
      {children}
    </DashboardShell>
  );
}
