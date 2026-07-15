"use client";

import { useState, useTransition } from "react";
import { promoteStudents } from "@/app/admin/courses/promote/actions";

type Course = { id: number; name: string; year: number };

export default function PromoteForm({ courses }: { courses: Course[] }) {
  const [fromCourseId, setFromCourseId] = useState(courses[0]?.id);
  const [toCourseId, setToCourseId] = useState(courses[1]?.id ?? courses[0]?.id);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await promoteStudents(formData);
        setMessage(`${result.moved} estudiantes movidos.`);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Error al promover.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex max-w-xl flex-col gap-3 text-sm">
      <label>
        Curso de origen
        <select
          name="fromCourseId"
          value={fromCourseId}
          onChange={(e) => setFromCourseId(Number(e.target.value))}
          className="input mt-1 w-full"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.year})
            </option>
          ))}
        </select>
      </label>
      <label>
        Curso de destino
        <select
          name="toCourseId"
          value={toCourseId}
          onChange={(e) => setToCourseId(Number(e.target.value))}
          className="input mt-1 w-full"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.year})
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-2 w-fit"
      >
        {pending ? "Promoviendo..." : "Promover estudiantes"}
      </button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
