import { db } from "@/db";
import {
  users,
  courses,
  subjects,
  students,
  guardians,
  scheduleBlocks,
  inspectorCourseAssignments,
  substituteAssignments,
  attendanceRecords,
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Datos de demostración para mostrar la UI de cada rol antes de registrar
// los correos reales de los funcionarios. Todo queda marcado con el
// prefijo "DEMO" para poder identificarlo y borrarlo después con
// remove-demo-data.ts. No modifica tu usuario ni tu rol — eso se hace
// aparte con set-role.ts.

function isoWeekdayToday(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

async function main() {
  const adminEmail = process.argv[2];
  if (!adminEmail) {
    console.error("Uso: npm run seed:demo -- tu-correo@liceoeduardocharme.cl");
    process.exit(1);
  }

  const admin = await db.query.users.findFirst({ where: eq(users.email, adminEmail) });
  if (!admin) {
    console.error(`No existe un usuario con el correo ${adminEmail}. Debes iniciar sesión al menos una vez antes.`);
    process.exit(1);
  }

  const settings = await db.query.schoolSettings.findFirst();
  const year = settings?.currentYear ?? new Date().getFullYear();

  let course = await db.query.courses.findFirst({ where: eq(courses.name, "DEMO - Curso Prueba") });
  if (!course) {
    [course] = await db
      .insert(courses)
      .values({ name: "DEMO - Curso Prueba", gradeLevel: "DEMO", year, isActive: true })
      .returning();
    console.log("Curso demo creado.");
  }

  let subject = await db.query.subjects.findFirst({ where: eq(subjects.name, "DEMO - Asignatura Prueba") });
  if (!subject) {
    [subject] = await db.insert(subjects).values({ name: "DEMO - Asignatura Prueba" }).returning();
    console.log("Asignatura demo creada.");
  }

  let guardian = await db.query.guardians.findFirst({ where: eq(guardians.fullName, "DEMO - Apoderado Prueba") });
  if (!guardian) {
    [guardian] = await db
      .insert(guardians)
      .values({
        fullName: "DEMO - Apoderado Prueba",
        phoneE164: "+56900000000",
        email: "demo-apoderado@example.com",
        optOut: true, // nunca se envía WhatsApp real a este apoderado de prueba
      })
      .returning();
    console.log("Apoderado demo creado (opt_out activado: no recibe WhatsApp real).");
  }

  const demoStudentDefs = [
    { identifier: "DEMO-0001", firstName: "DEMO", lastName: "Estudiante Uno" },
    { identifier: "DEMO-0002", firstName: "DEMO", lastName: "Estudiante Dos" },
  ];
  const demoStudents = [];
  for (const def of demoStudentDefs) {
    let student = await db.query.students.findFirst({
      where: eq(students.identifier, def.identifier),
    });
    if (!student) {
      [student] = await db
        .insert(students)
        .values({
          identifier: def.identifier,
          identifierType: "pasaporte",
          firstName: def.firstName,
          lastName: def.lastName,
          courseId: course.id,
          guardianId: guardian.id,
          isActive: true,
        })
        .returning();
      console.log(`Estudiante demo creado: ${def.firstName} ${def.lastName}.`);
    }
    demoStudents.push(student);
  }

  const dayOfWeek = isoWeekdayToday();
  let block = await db.query.scheduleBlocks.findFirst({
    where: eq(scheduleBlocks.courseId, course.id),
  });
  if (!block) {
    [block] = await db
      .insert(scheduleBlocks)
      .values({
        courseId: course.id,
        dayOfWeek,
        blockNumber: 1,
        subjectId: subject.id,
        teacherId: admin.id,
        startTime: "08:00",
        endTime: "08:45",
        year,
      })
      .returning();
    console.log("Bloque de horario demo creado (hoy, bloque 1, a tu propio usuario).");
  }

  const existingAssignment = await db.query.inspectorCourseAssignments.findFirst({
    where: eq(inspectorCourseAssignments.inspectorId, admin.id),
  });
  if (!existingAssignment) {
    await db.insert(inspectorCourseAssignments).values({ inspectorId: admin.id, courseId: course.id });
    console.log("Curso demo asignado a tu usuario como inspector de pasillo.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const existingSubstitution = await db.query.substituteAssignments.findFirst({
    where: eq(substituteAssignments.courseId, course.id),
  });
  if (!existingSubstitution) {
    await db.insert(substituteAssignments).values({
      courseId: course.id,
      blockNumber: 1,
      date: today,
      substituteTeacherId: admin.id,
      createdBy: admin.id,
    });
    console.log("Reemplazo demo activado (para ver el badge \"Reemplazo\").");
  }

  const existingRecord = await db.query.attendanceRecords.findFirst({
    where: eq(attendanceRecords.studentId, demoStudents[0].id),
  });
  if (!existingRecord) {
    await db.insert(attendanceRecords).values({
      studentId: demoStudents[0].id,
      courseId: course.id,
      subjectId: subject.id,
      teacherId: admin.id,
      date: today,
      blockNumber: 1,
      status: "ausente",
    });
    console.log("Registro de asistencia demo creado (1 ausencia hoy, para reportes/dashboard).");
  }

  console.log("\nListo. Ahora usa set-role.ts para probar cada rol con tu propia cuenta.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
