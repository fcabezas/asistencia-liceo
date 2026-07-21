import { db } from "@/db";
import {
  courses,
  subjects,
  guardians,
  students,
  scheduleBlocks,
  inspectorCourseAssignments,
  substituteAssignments,
  attendanceRecords,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// Borra todo lo creado por seed-demo-data.ts (identificado por los nombres
// con prefijo "DEMO"), en el orden correcto para no chocar con las FKs.
// No toca tu usuario ni tu rol: para eso usa set-role.ts.

async function main() {
  const course = await db.query.courses.findFirst({ where: eq(courses.name, "DEMO - Curso Prueba") });
  const subject = await db.query.subjects.findFirst({ where: eq(subjects.name, "DEMO - Asignatura Prueba") });
  const guardian = await db.query.guardians.findFirst({ where: eq(guardians.fullName, "DEMO - Apoderado Prueba") });

  const demoStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(inArray(students.identifier, ["DEMO-0001", "DEMO-0002"]));
  const studentIds = demoStudents.map((s) => s.id);

  if (studentIds.length) {
    await db.delete(attendanceRecords).where(inArray(attendanceRecords.studentId, studentIds));
    await db.delete(students).where(inArray(students.id, studentIds));
    console.log(`Estudiantes demo eliminados: ${studentIds.length}.`);
  }

  if (course) {
    await db.delete(scheduleBlocks).where(eq(scheduleBlocks.courseId, course.id));
    await db.delete(inspectorCourseAssignments).where(eq(inspectorCourseAssignments.courseId, course.id));
    await db.delete(substituteAssignments).where(eq(substituteAssignments.courseId, course.id));
    await db.delete(courses).where(eq(courses.id, course.id));
    console.log("Curso demo y sus horarios/asignaciones eliminados.");
  }

  if (subject) {
    await db.delete(subjects).where(eq(subjects.id, subject.id));
    console.log("Asignatura demo eliminada.");
  }

  if (guardian) {
    await db.delete(guardians).where(eq(guardians.id, guardian.id));
    console.log("Apoderado demo eliminado.");
  }

  console.log("Limpieza completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
