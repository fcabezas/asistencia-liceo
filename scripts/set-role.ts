import { db } from "@/db";
import { users, userRole } from "@/db/schema";
import { eq } from "drizzle-orm";

// Cambia el rol de UN usuario existente, para poder ver la UI de cada rol
// con tu propia cuenta durante una demo. Después de cada cambio, cierra
// sesión y vuelve a entrar con Google para que la sesión tome el rol nuevo
// (el rol queda grabado en el JWT de sesión, no se relee solo).

const VALID_ROLES = userRole.enumValues;

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    console.error("Uso: npm run set-role -- correo@liceoeduardocharme.cl <rol>");
    console.error(`Roles válidos: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    console.error(`Rol inválido: "${role}". Roles válidos: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!existing) {
    console.error(`No existe un usuario con el correo ${email}.`);
    process.exit(1);
  }

  await db.update(users).set({ role: role as (typeof VALID_ROLES)[number] }).where(eq(users.id, existing.id));

  console.log(`${email}: rol cambiado de "${existing.role}" a "${role}".`);
  console.log("Cierra sesión y vuelve a entrar con Google para ver el rol nuevo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
