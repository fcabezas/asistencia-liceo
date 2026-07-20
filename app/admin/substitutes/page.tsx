import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SubstitutesManager from "@/components/SubstitutesManager";

export default async function AdminSubstitutesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return <SubstitutesManager role="admin" userId={Number(session.user.id)} />;
}
