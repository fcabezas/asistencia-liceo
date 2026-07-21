import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ExitsManager from "@/components/ExitsManager";

export default async function AdminExitsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return <ExitsManager role="admin" userId={Number(session.user.id)} />;
}
