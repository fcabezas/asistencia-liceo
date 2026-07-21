import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ExitsManager from "@/components/ExitsManager";

export default async function InspectorExitsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  return <ExitsManager role={role} userId={Number(session.user.id)} />;
}
