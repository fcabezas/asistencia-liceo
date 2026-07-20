import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SubstitutesManager from "@/components/SubstitutesManager";

export default async function SubstitutesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "inspector_general" && role !== "inspector_pasillo")) {
    redirect("/login");
  }

  return <SubstitutesManager role={role} userId={Number(session.user.id)} />;
}
