import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PendingNotificationsView from "@/components/PendingNotificationsView";

export default async function PendingNotificationsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  return <PendingNotificationsView role={role} userId={Number(session.user.id)} />;
}
