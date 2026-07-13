import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceReportView from "@/components/AttendanceReportView";

export default async function DirectorReports({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; startDate?: string; endDate?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "director" && role !== "admin")) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Reportes de asistencia</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Vista de solo lectura con estadísticas agregadas por curso y periodo.
      </p>
      <div className="mt-6">
        <AttendanceReportView searchParams={params} />
      </div>
    </div>
  );
}
