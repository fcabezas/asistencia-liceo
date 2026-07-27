import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AttendanceStatusView from "@/components/AttendanceStatusView";

export default async function AdminAttendanceStatusPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return <AttendanceStatusView role="admin" userId={Number(session.user.id)} />;
}
