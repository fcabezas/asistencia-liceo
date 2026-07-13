"use client";

import { useState, useTransition } from "react";
import { saveAttendanceAction } from "@/app/attendance/[courseId]/[blockNumber]/actions";

type Student = { id: number; firstName: string; lastName: string };
type EditableStatus = "presente" | "ausente" | "atraso";

const OPTIONS: { value: EditableStatus; label: string }[] = [
  { value: "presente", label: "Presente" },
  { value: "atraso", label: "Atraso" },
  { value: "ausente", label: "Ausente" },
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
      <p className="text-sm text-zinc-500">
        Todos parten como &quot;Presente&quot;. Solo marca a quienes falten o
        lleguen atrasados.
      </p>

      <ul className="flex max-w-xl flex-col divide-y rounded border">
        {editableStudents.map((s) => (
          <li key={s.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              {s.lastName}, {s.firstName}
            </span>
            <div className="flex gap-1">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                  className={`rounded px-2 py-1 text-xs ${
                    statuses[s.id] === opt.value
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "border text-zinc-600 dark:text-zinc-400"
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
          <p className="text-sm font-medium text-zinc-500">
            Ya justificados por inspectoría (no editable aquí):
          </p>
          <ul className="mt-1 flex flex-col gap-1 text-sm text-zinc-500">
            {justifiedStudents.map((s) => (
              <li key={s.id}>
                {s.lastName}, {s.firstName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Guardando..." : `Guardar (${exceptionCount} excepciones)`}
        </button>
        {message && <span className="text-sm">{message}</span>}
      </div>
    </div>
  );
}
