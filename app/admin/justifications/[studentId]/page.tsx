import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import StudentJustificationView from "@/components/StudentJustificationView";

export default async function AdminStudentJustificationPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const { studentId: studentIdParam } = await params;

  return (
    <StudentJustificationView
      studentId={Number(studentIdParam)}
      role="admin"
      userId={Number(session.user.id)}
    />
  );
}
