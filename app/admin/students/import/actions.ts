"use server";

import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import {
  parseStudentsCsv,
  buildImportPreview,
  commitImport,
  type ImportPreview,
} from "@/lib/csv-import";

async function currentYear(): Promise<number> {
  const settings = await db.query.schoolSettings.findFirst();
  return settings?.currentYear ?? new Date().getFullYear();
}

export async function previewStudentsImport(
  csvText: string,
  autoCreateCourses: boolean
): Promise<{ parseErrors: string[]; preview: ImportPreview | null; year: number }> {
  await requireRole("admin");
  const year = await currentYear();

  const { data, parseErrors } = parseStudentsCsv(csvText);
  if (parseErrors.length > 0) {
    return { parseErrors, preview: null, year };
  }
  const preview = await buildImportPreview(data, { year, autoCreateCourses });
  return { parseErrors: [], preview, year };
}

export async function commitStudentsImport(
  csvText: string,
  autoCreateCourses: boolean
): Promise<{ studentsCreated: number; studentsUpdated: number; guardiansCreated: number }> {
  await requireRole("admin");
  const year = await currentYear();

  const { data, parseErrors } = parseStudentsCsv(csvText);
  if (parseErrors.length > 0) {
    throw new Error(parseErrors.join("; "));
  }
  const preview = await buildImportPreview(data, { year, autoCreateCourses });
  return commitImport(preview, { year, autoCreateCourses });
}
