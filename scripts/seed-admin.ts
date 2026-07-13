import { db } from "@/db";
import { users, schoolSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npm run seed:admin -- correo@dominio.cl");
    process.exit(1);
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    await db.update(users).set({ role: "admin", isActive: true }).where(eq(users.id, existing.id));
    console.log(`Usuario existente ${email} promovido a admin.`);
  } else {
    // googleSub queda pendiente: se completa en el primer login real con Google.
    await db.insert(users).values({
      googleSub: `pending:${email}`,
      email,
      name: email,
      role: "admin",
    });
    console.log(`Admin ${email} sembrado (se vincula a su cuenta Google en el primer login).`);
  }

  const settings = await db.query.schoolSettings.findFirst();
  if (!settings) {
    await db.insert(schoolSettings).values({
      id: 1,
      name: "Liceo Eduardo Charme",
      currentYear: new Date().getFullYear(),
    });
    console.log("school_settings inicializado.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
