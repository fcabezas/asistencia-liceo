import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function InspectorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <nav className="w-56 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
        <p className="mb-4 text-sm font-semibold text-zinc-500">Inspectoría</p>
        <ul className="flex flex-col gap-1">
          <li>
            <Link href="/inspector/dashboard" className="block rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Asistencia no tomada
            </Link>
          </li>
          <li>
            <Link href="/inspector/justifications" className="block rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Justificaciones
            </Link>
          </li>
          {role === "inspector_general" && (
            <li>
              <Link href="/inspector/notifications" className="block rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
                Notificaciones fallidas
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
