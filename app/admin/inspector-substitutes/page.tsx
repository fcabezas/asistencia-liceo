import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import InspectorSubstitutesManager from "@/components/InspectorSubstitutesManager";

export default async function AdminInspectorSubstitutesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return <InspectorSubstitutesManager />;
}
