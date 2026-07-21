import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import InspectorSubstitutesManager from "@/components/InspectorSubstitutesManager";

export default async function InspectorInspectorSubstitutesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "inspector_general") {
    redirect("/inspector/dashboard");
  }

  return <InspectorSubstitutesManager />;
}
