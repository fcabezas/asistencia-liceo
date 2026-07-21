import "server-only";
import { db } from "@/db";
import { students, inspectorCourseAssignments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Whether this user can register/remove a retiro for this student. */
export async function canActOnStudent(
  role: string,
  userId: number,
  studentId: number
): Promise<boolean> {
  if (role === "admin" || role === "inspector_general") return true;
  if (role !== "inspector_pasillo") return false;

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student) return false;

  const assignment = await db.query.inspectorCourseAssignments.findFirst({
    where: and(
      eq(inspectorCourseAssignments.inspectorId, userId),
      eq(inspectorCourseAssignments.courseId, student.courseId)
    ),
  });
  return Boolean(assignment);
}
