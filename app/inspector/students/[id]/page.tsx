import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { students, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import StudentTagsManager from "@/components/StudentTagsManager";

export default async function InspectorStudentTagsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "inspector_general") {
    redirect("/inspector/dashboard");
  }

  const { id } = await params;
  const studentId = Number(id);

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student) notFound();

  const course = await db.query.courses.findFirst({ where: eq(courses.id, student.courseId) });

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-white">
        {student.lastName}, {student.firstName}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-brand-300">{course?.name}</p>

      <div className="mt-6 max-w-2xl">
        <StudentTagsManager studentId={studentId} />
      </div>
    </div>
  );
}
