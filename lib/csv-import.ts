import Papa from "papaparse";
import { db } from "@/db";
import { students, guardians, courses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isValidRut, formatRut } from "@/lib/rut";
import { normalizeChileanMobile } from "@/lib/phone";

export type StudentCsvRow = {
  identifier: string;
  identifier_type: string;
  first_name: string;
  last_name: string;
  course_name: string;
  guardian_rut: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
};

export type ImportRowResult = {
  row: number;
  raw: Record<string, string>;
  errors: string[];
  studentIdentifier: string;
  studentIdentifierType: "rut" | "pasaporte";
  firstName: string;
  lastName: string;
  courseId: number | null;
  courseName: string;
  studentAction: "create" | "update" | "error";
  guardianId: number | null;
  guardianName: string;
  guardianPhone: string | null;
  guardianRut: string | null;
  guardianEmail: string | null;
  guardianAction: "create" | "update" | "reuse" | "error";
};

export type ImportPreview = {
  rows: ImportRowResult[];
  validCount: number;
  errorCount: number;
};

const REQUIRED_COLUMNS = [
  "identifier",
  "first_name",
  "last_name",
  "course_name",
  "guardian_name",
  "guardian_phone",
];

export function parseStudentsCsv(csvText: string): {
  data: StudentCsvRow[];
  parseErrors: string[];
} {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const parseErrors = result.errors.map(
    (e) => `Fila ${e.row ?? "?"}: ${e.message}`
  );

  const headers = result.meta.fields ?? [];
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      parseErrors.push(`Falta la columna obligatoria "${col}" en el CSV.`);
    }
  }

  return {
    data: result.data.map((row) => ({
      identifier: (row.identifier ?? "").trim(),
      identifier_type: (row.identifier_type ?? "rut").trim().toLowerCase(),
      first_name: (row.first_name ?? "").trim(),
      last_name: (row.last_name ?? "").trim(),
      course_name: (row.course_name ?? "").trim(),
      guardian_rut: (row.guardian_rut ?? "").trim(),
      guardian_name: (row.guardian_name ?? "").trim(),
      guardian_phone: (row.guardian_phone ?? "").trim(),
      guardian_email: (row.guardian_email ?? "").trim(),
    })),
    parseErrors,
  };
}

/**
 * Validates rows and resolves what would happen on commit, without writing
 * anything. Guardian dedup checks both the DB and rows already seen earlier
 * in this same file, so siblings on the same import share one guardian.
 */
export async function buildImportPreview(
  rows: StudentCsvRow[],
  opts: { year: number; autoCreateCourses: boolean }
): Promise<ImportPreview> {
  const results: ImportRowResult[] = [];

  // rut/phone -> guardian resolution already decided earlier in this file
  const seenGuardiansByRut = new Map<string, { id: number | null; name: string; phone: string; email: string }>();
  const seenGuardiansByPhone = new Map<string, { id: number | null; name: string; phone: string; email: string }>();

  const courseCache = new Map<string, number | null>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    const errors: string[] = [];

    // --- Student identifier ---
    const identifierType = raw.identifier_type === "pasaporte" ? "pasaporte" : "rut";
    let identifier = raw.identifier;
    if (!identifier) {
      errors.push("Falta identificador (RUT o pasaporte) del estudiante.");
    } else if (identifierType === "rut") {
      if (!isValidRut(identifier)) {
        errors.push(`RUT de estudiante inválido: "${raw.identifier}".`);
      } else {
        identifier = formatRut(identifier);
      }
    }

    if (!raw.first_name) errors.push("Falta nombre del estudiante.");
    if (!raw.last_name) errors.push("Falta apellido del estudiante.");

    // --- Course ---
    let courseId: number | null = null;
    if (!raw.course_name) {
      errors.push("Falta curso.");
    } else {
      const cacheKey = raw.course_name.toLowerCase();
      if (courseCache.has(cacheKey)) {
        courseId = courseCache.get(cacheKey) ?? null;
      } else {
        const existing = await db.query.courses.findFirst({
          where: and(eq(courses.name, raw.course_name), eq(courses.year, opts.year)),
        });
        courseId = existing?.id ?? null;
        courseCache.set(cacheKey, courseId);
      }
      if (!courseId && !opts.autoCreateCourses) {
        errors.push(`Curso "${raw.course_name}" no existe (activa "crear cursos automáticamente" o créalo antes).`);
      }
    }

    // --- Guardian ---
    let guardianRut: string | null = null;
    if (raw.guardian_rut) {
      if (!isValidRut(raw.guardian_rut)) {
        errors.push(`RUT de apoderado inválido: "${raw.guardian_rut}".`);
      } else {
        guardianRut = formatRut(raw.guardian_rut);
      }
    }

    if (!raw.guardian_name) errors.push("Falta nombre del apoderado.");

    let guardianPhone: string | null = null;
    if (!raw.guardian_phone) {
      errors.push("Falta teléfono del apoderado.");
    } else {
      guardianPhone = normalizeChileanMobile(raw.guardian_phone);
      if (!guardianPhone) {
        errors.push(`Teléfono de apoderado inválido: "${raw.guardian_phone}" (debe ser un móvil chileno).`);
      }
    }

    let guardianId: number | null = null;
    let guardianAction: ImportRowResult["guardianAction"] = "create";

    if (errors.length === 0) {
      // 1. Match against rows already processed in this same file.
      const seenByRut = guardianRut ? seenGuardiansByRut.get(guardianRut) : undefined;
      const seenByPhone = guardianPhone ? seenGuardiansByPhone.get(guardianPhone) : undefined;
      const seen = seenByRut ?? seenByPhone;

      if (seen) {
        guardianId = seen.id;
        guardianAction = seen.id ? "reuse" : "create";
      } else {
        // 2. Match against the DB.
        const existing = guardianRut
          ? await db.query.guardians.findFirst({ where: eq(guardians.rut, guardianRut) })
          : guardianPhone
            ? await db.query.guardians.findFirst({ where: eq(guardians.phoneE164, guardianPhone) })
            : undefined;

        if (existing) {
          guardianId = existing.id;
          guardianAction = "update";
        } else {
          guardianId = null;
          guardianAction = "create";
        }
      }

      const record = { id: guardianId, name: raw.guardian_name, phone: guardianPhone ?? "", email: raw.guardian_email };
      if (guardianRut) seenGuardiansByRut.set(guardianRut, record);
      if (guardianPhone) seenGuardiansByPhone.set(guardianPhone, record);
    }

    // --- Student create/update ---
    let studentAction: ImportRowResult["studentAction"] = "create";
    if (errors.length === 0 && identifier) {
      const existingStudent = await db.query.students.findFirst({
        where: and(eq(students.identifier, identifier), eq(students.identifierType, identifierType)),
      });
      studentAction = existingStudent ? "update" : "create";
    } else {
      studentAction = "error";
    }

    results.push({
      row: rowNum,
      raw,
      errors,
      studentIdentifier: identifier,
      studentIdentifierType: identifierType,
      firstName: raw.first_name,
      lastName: raw.last_name,
      courseId,
      courseName: raw.course_name,
      studentAction: errors.length > 0 ? "error" : studentAction,
      guardianId,
      guardianName: raw.guardian_name,
      guardianPhone,
      guardianRut,
      guardianEmail: raw.guardian_email || null,
      guardianAction: errors.length > 0 ? "error" : guardianAction,
    });
  }

  return {
    rows: results,
    validCount: results.filter((r) => r.errors.length === 0).length,
    errorCount: results.filter((r) => r.errors.length > 0).length,
  };
}

export async function commitImport(
  preview: ImportPreview,
  opts: { year: number; autoCreateCourses: boolean }
): Promise<{ studentsCreated: number; studentsUpdated: number; guardiansCreated: number }> {
  let studentsCreated = 0;
  let studentsUpdated = 0;
  let guardiansCreated = 0;

  await db.transaction(async (tx) => {
    const courseCache = new Map<string, number>();
    const guardianCache = new Map<string, number>(); // key: rut or phone -> guardian id

    for (const row of preview.rows) {
      if (row.errors.length > 0) continue;

      // Resolve/create course
      let courseId = row.courseId;
      if (!courseId) {
        const cacheKey = row.courseName.toLowerCase();
        if (courseCache.has(cacheKey)) {
          courseId = courseCache.get(cacheKey)!;
        } else if (opts.autoCreateCourses) {
          const [created] = await tx
            .insert(courses)
            .values({ name: row.courseName, gradeLevel: row.courseName, year: opts.year })
            .returning({ id: courses.id });
          courseId = created.id;
          courseCache.set(cacheKey, courseId);
        }
      }
      if (!courseId) continue;

      // Resolve/create guardian
      const dedupKey = row.guardianRut ?? row.guardianPhone ?? `row-${row.row}`;
      let guardianId = guardianCache.get(dedupKey) ?? row.guardianId ?? undefined;

      if (!guardianId) {
        const [created] = await tx
          .insert(guardians)
          .values({
            fullName: row.guardianName,
            phoneE164: row.guardianPhone!,
            email: row.guardianEmail,
            rut: row.guardianRut,
          })
          .returning({ id: guardians.id });
        guardianId = created.id;
        guardiansCreated++;
      } else if (row.guardianAction === "update") {
        await tx
          .update(guardians)
          .set({
            fullName: row.guardianName,
            phoneE164: row.guardianPhone!,
            email: row.guardianEmail,
          })
          .where(eq(guardians.id, guardianId));
      }
      guardianCache.set(dedupKey, guardianId);

      // Upsert student
      const existingStudent = await tx.query.students.findFirst({
        where: and(
          eq(students.identifier, row.studentIdentifier),
          eq(students.identifierType, row.studentIdentifierType)
        ),
      });

      if (existingStudent) {
        await tx
          .update(students)
          .set({
            firstName: row.firstName,
            lastName: row.lastName,
            courseId,
            guardianId,
          })
          .where(eq(students.id, existingStudent.id));
        studentsUpdated++;
      } else {
        await tx.insert(students).values({
          identifier: row.studentIdentifier,
          identifierType: row.studentIdentifierType,
          firstName: row.firstName,
          lastName: row.lastName,
          courseId,
          guardianId,
        });
        studentsCreated++;
      }
    }
  });

  return { studentsCreated, studentsUpdated, guardiansCreated };
}
