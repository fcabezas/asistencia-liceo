import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ImportStudentsForm from "@/components/ImportPreviewTable";

export default async function ImportStudentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Importar estudiantes y apoderados</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Sube el CSV exportado de SIGE. Se muestra una previsualización con
        errores antes de confirmar; puedes corregir el archivo y volver a
        subirlo las veces que necesites.
      </p>
      <div className="mt-6">
        <ImportStudentsForm />
      </div>
    </div>
  );
}
