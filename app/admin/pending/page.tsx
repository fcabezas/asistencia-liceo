import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PendingNotificationsView from "@/components/PendingNotificationsView";

export default async function AdminPendingPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return <PendingNotificationsView role="admin" userId={Number(session.user.id)} />;
}
