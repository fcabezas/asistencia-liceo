import "server-only";
import { db } from "@/db";
import { studentTags } from "@/db/schema";
import { and, inArray, lte, or, gte, isNull } from "drizzle-orm";

export const TAG_TYPE_LABELS: Record<string, string> = {
  pase_ingreso: "Pase de ingreso",
  condicion_especial: "Condición especial",
  internado: "Internado",
  colacion: "Colación",
};

export function canManageStudentTags(role: string): boolean {
  return role === "admin" || role === "inspector_general";
}

/** Tags currently in effect (validFrom/validUntil window includes `date`, or no window set). */
export async function getActiveTagsForStudents(studentIds: number[], date: string) {
  if (studentIds.length === 0) return [];
  return db
    .select()
    .from(studentTags)
    .where(
      and(
        inArray(studentTags.studentId, studentIds),
        or(isNull(studentTags.validFrom), lte(studentTags.validFrom, date)),
        or(isNull(studentTags.validUntil), gte(studentTags.validUntil, date))
      )
    );
}
