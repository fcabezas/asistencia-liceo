import "server-only";
import { db } from "@/db";
import { courses, inspectorCourseAssignments, inspectorSubstituteAssignments } from "@/db/schema";
import { and, asc, eq, inArray, lte, gte } from "drizzle-orm";
import { chileToday } from "@/lib/date";

/** Courses an inspector can act on: all of them for inspector_general/admin, only assigned ones
 * (plus any covered while substituting for another inspector_pasillo today) for inspector_pasillo. */
export async function getScopedCourses(role: string, inspectorId: number) {
  if (role === "inspector_general" || role === "admin") {
    return db.select().from(courses).where(eq(courses.isActive, true)).orderBy(asc(courses.name));
  }

  const { date: today } = chileToday();

  const [ownAssignments, coverage] = await Promise.all([
    db
      .select({ courseId: inspectorCourseAssignments.courseId })
      .from(inspectorCourseAssignments)
      .where(eq(inspectorCourseAssignments.inspectorId, inspectorId)),
    db
      .select({ absentInspectorId: inspectorSubstituteAssignments.absentInspectorId })
      .from(inspectorSubstituteAssignments)
      .where(
        and(
          eq(inspectorSubstituteAssignments.substituteInspectorId, inspectorId),
          lte(inspectorSubstituteAssignments.startDate, today),
          gte(inspectorSubstituteAssignments.endDate, today)
        )
      ),
  ]);

  const absentInspectorIds = coverage.map((c) => c.absentInspectorId);

  const coveredAssignments = absentInspectorIds.length
    ? await db
        .select({ courseId: inspectorCourseAssignments.courseId })
        .from(inspectorCourseAssignments)
        .where(inArray(inspectorCourseAssignments.inspectorId, absentInspectorIds))
    : [];

  const courseIds = [...new Set([...ownAssignments, ...coveredAssignments].map((a) => a.courseId))];
  if (courseIds.length === 0) return [];

  return db
    .select()
    .from(courses)
    .where(and(eq(courses.isActive, true), inArray(courses.id, courseIds)))
    .orderBy(asc(courses.name));
}
