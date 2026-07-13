import AttendanceReportView from "@/components/AttendanceReportView";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">Reportes de asistencia</h1>
      <div className="mt-6">
        <AttendanceReportView searchParams={params} />
      </div>
    </div>
  );
}
