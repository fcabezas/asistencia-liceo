import "server-only";
import { db } from "@/db";
import { courses, inspectorCourseAssignments } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

/** Courses an inspector can act on: all of them for inspector_general, only assigned ones for inspector_pasillo. */
export async function getScopedCourses(role: string, inspectorId: number) {
  if (role === "inspector_general") {
    return db.select().from(courses).where(eq(courses.isActive, true)).orderBy(asc(courses.name));
  }

  const assignments = await db
    .select({ courseId: inspectorCourseAssignments.courseId })
    .from(inspectorCourseAssignments)
    .where(eq(inspectorCourseAssignments.inspectorId, inspectorId));

  const courseIds = assignments.map((a) => a.courseId);
  if (courseIds.length === 0) return [];

  return db
    .select()
    .from(courses)
    .where(and(eq(courses.isActive, true), inArray(courses.id, courseIds)))
    .orderBy(asc(courses.name));
}
