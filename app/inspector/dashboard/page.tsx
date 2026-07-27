import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AttendanceStatusView from "@/components/AttendanceStatusView";

export default async function InspectorDashboard() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  return <AttendanceStatusView role={role} userId={Number(session.user.id)} />;
}
