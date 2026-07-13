import { db } from "@/db";
import { users, userRole } from "@/db/schema";
import { asc } from "drizzle-orm";
import { updateUserRole, toggleUserActive } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  director: "Director",
  inspector_general: "Inspector general",
  inspector_pasillo: "Inspector de pasillo",
  teacher: "Profesor",
};

export default async function UsersPage() {
  const allUsers = await db.select().from(users).orderBy(asc(users.name));

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Usuarios y roles</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Los usuarios aparecen aquí automáticamente tras su primer login con
        Google (como &quot;Profesor&quot;). Asigna aquí los demás roles.
      </p>

      <table className="mt-6 w-full max-w-3xl text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Nombre</th>
            <th className="p-2">Email</th>
            <th className="p-2">Rol</th>
            <th className="p-2">Activo</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                <form action={updateUserRole.bind(null, u.id)} className="flex items-center gap-2">
                  <select name="role" defaultValue={u.role} className="rounded border px-2 py-1">
                    {userRole.enumValues.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-blue-600 underline">
                    Guardar
                  </button>
                </form>
              </td>
              <td className="p-2">
                <form action={toggleUserActive.bind(null, u.id, !u.isActive)}>
                  <button className="text-blue-600 underline" type="submit">
                    {u.isActive ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
