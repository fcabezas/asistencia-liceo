"use client";

import { useState, useTransition } from "react";
import { saveAttendanceAction } from "@/app/attendance/[courseId]/[blockNumber]/actions";

type Student = { id: number; firstName: string; lastName: string };
type EditableStatus = "presente" | "ausente" | "atraso";

const OPTIONS: { value: EditableStatus; label: string; selectedClass: string }[] = [
  { value: "presente", label: "Presente", selectedClass: "bg-brand-700 text-white" },
  { value: "atraso", label: "Atraso", selectedClass: "bg-gold-500 text-brand-950" },
  { value: "ausente", label: "Ausente", selectedClass: "bg-red-600 text-white" },
];

export default function AttendanceGrid({
  courseId,
  blockNumber,
  students,
  initialStatuses,
  justifiedStudentIds,
}: {
  courseId: number;
  blockNumber: number;
  students: Student[];
  initialStatuses: Record<number, EditableStatus>;
  justifiedStudentIds: number[];
}) {
  const editableStudents = students.filter((s) => !justifiedStudentIds.includes(s.id));
  const justifiedStudents = students.filter((s) => justifiedStudentIds.includes(s.id));

  const [statuses, setStatuses] = useState<Record<number, EditableStatus>>(() => {
    const init: Record<number, EditableStatus> = {};
    for (const s of editableStudents) init[s.id] = initialStatuses[s.id] ?? "presente";
    return init;
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await saveAttendanceAction({
          courseId,
          blockNumber,
          statuses: editableStudents.map((s) => ({ studentId: s.id, status: statuses[s.id] })),
        });
        setMessage("Asistencia guardada.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  const exceptionCount = Object.values(statuses).filter((s) => s !== "presente").length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500 dark:text-brand-300">
        Todos parten como &quot;Presente&quot;. Solo marca a quienes falten o
        lleguen atrasados.
      </p>

      <ul className="flex max-w-xl flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-brand-800 dark:border-brand-800">
        {editableStudents.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-brand-900 dark:text-white">
              {s.lastName}, {s.firstName}
            </span>
            <div className="flex flex-wrap gap-1">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium ${
                    statuses[s.id] === opt.value
                      ? opt.selectedClass
                      : "border border-zinc-300 text-zinc-600 dark:border-brand-700 dark:text-brand-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {justifiedStudents.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-brand-300">
            Ya justificados por inspectoría (no editable aquí):
          </p>
          <ul className="mt-1 flex flex-col gap-1 text-sm text-zinc-500 dark:text-brand-300">
            {justifiedStudents.map((s) => (
              <li key={s.id}>
                {s.lastName}, {s.firstName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleSave} disabled={pending} className="btn-primary">
          {pending ? "Guardando..." : `Guardar (${exceptionCount} excepciones)`}
        </button>
        {message && <span className="text-sm text-brand-900 dark:text-brand-100">{message}</span>}
      </div>
    </div>
  );
}
