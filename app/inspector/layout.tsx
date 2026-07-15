import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default async function InspectorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  const links = [
    { href: "/inspector/dashboard", label: "Asistencia no tomada" },
    { href: "/inspector/pending", label: "Avisos pendientes" },
    { href: "/inspector/justifications", label: "Justificaciones" },
    { href: "/inspector/substitutes", label: "Reemplazos (PIE)" },
    ...(role === "inspector_general"
      ? [{ href: "/inspector/notifications", label: "Notificaciones fallidas" }]
      : []),
  ];

  return (
    <DashboardShell title="Inspectoría" links={links}>
      {children}
    </DashboardShell>
  );
}
