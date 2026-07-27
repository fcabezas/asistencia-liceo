import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import JustificationsSearchView from "@/components/JustificationsSearchView";

export default async function AdminJustificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const { q } = await searchParams;

  return (
    <JustificationsSearchView
      role="admin"
      userId={Number(session.user.id)}
      q={q}
      basePath="/admin/justifications"
    />
  );
}
