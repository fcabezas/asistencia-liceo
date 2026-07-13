import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/students", label: "Estudiantes" },
  { href: "/admin/students/import", label: "Importar CSV" },
  { href: "/admin/courses", label: "Cursos y asignaturas" },
  { href: "/admin/schedule", label: "Horario" },
  { href: "/admin/teachers", label: "Profesores y asignaciones" },
  { href: "/admin/inspector-assignments", label: "Inspectores de pasillo" },
  { href: "/admin/users", label: "Usuarios y roles" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen">
      <nav className="w-56 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
        <p className="mb-4 text-sm font-semibold text-zinc-500">Administración</p>
        <ul className="flex flex-col gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
