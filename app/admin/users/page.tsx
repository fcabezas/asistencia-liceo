import { db } from "@/db";
import { users, userRole } from "@/db/schema";
import { asc } from "drizzle-orm";
import { updateUserRole, toggleUserActive, createPendingUser } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  director: "Director",
  inspector_general: "Inspector general",
  inspector_pasillo: "Inspector de pasillo",
  teacher: "Profesor",
  pie: "PIE (reemplazo)",
};

export default async function UsersPage() {
  const allUsers = await db.select().from(users).orderBy(asc(users.name));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        Usuarios y roles
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-brand-300">
        Como el dominio de correo institucional puede ser compartido con otros
        colegios, nadie puede entrar por su cuenta la primera vez: primero
        agrega aquí el correo exacto de cada profesor/inspector/director, y
        recién ahí esa persona podrá iniciar sesión con Google.
      </p>

      <form
        action={createPendingUser}
        className="mt-6 flex max-w-2xl flex-wrap items-end gap-2 text-sm"
      >
        <div>
          <label className="label">Nombre</label>
          <input
            name="name"
            placeholder="Nombre completo"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Correo institucional</label>
          <input
            name="email"
            type="email"
            placeholder="nombre@slepcolchagua.cl"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Rol</label>
          <select name="role" defaultValue="teacher" className="input">
            {userRole.enumValues.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Agregar usuario
        </button>
      </form>

      <div className="mt-6 max-w-3xl overflow-x-auto rounded-lg border border-zinc-200 dark:border-brand-800">
        <table className="w-full text-left text-sm">
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
                  <form
                    action={updateUserRole.bind(null, u.id)}
                    className="flex items-center gap-2"
                  >
                    <select name="role" defaultValue={u.role} className="input">
                      {userRole.enumValues.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="link-action">
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="p-2">
                  <form action={toggleUserActive.bind(null, u.id, !u.isActive)}>
                    <button className="link-action" type="submit">
                      {u.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
