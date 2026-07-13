"use client";

import { useState } from "react";
import {
  previewStudentsImport,
  commitStudentsImport,
} from "@/app/admin/students/import/actions";
import type { ImportPreview } from "@/lib/csv-import";

export default function ImportStudentsForm() {
  const [csvText, setCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [autoCreateCourses, setAutoCreateCourses] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file, "utf-8");
  }

  async function handlePreview() {
    if (!csvText) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await previewStudentsImport(csvText, autoCreateCourses);
      setParseErrors(res.parseErrors);
      setPreview(res.preview);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!csvText) return;
    setBusy(true);
    try {
      const res = await commitStudentsImport(csvText, autoCreateCourses);
      setResult(
        `Import completo: ${res.studentsCreated} estudiantes creados, ${res.studentsUpdated} actualizados, ${res.guardiansCreated} apoderados nuevos.`
      );
      setPreview(null);
      setCsvText("");
      setFileName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Archivo CSV (columnas: identifier, identifier_type, first_name,
          last_name, course_name, guardian_rut, guardian_name, guardian_phone,
          guardian_email)
        </label>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
        {fileName && <p className="text-sm text-zinc-500 dark:text-brand-300">Archivo: {fileName}</p>}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoCreateCourses}
            onChange={(e) => setAutoCreateCourses(e.target.checked)}
          />
          Crear cursos automáticamente si no existen
        </label>

        <button
          onClick={handlePreview}
          disabled={!csvText || busy}
          className="btn-primary w-fit"
        >
          {busy ? "Procesando..." : "Previsualizar"}
        </button>
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-md border border-red-400 bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Errores de formato del archivo:</p>
          <ul className="list-disc pl-5">
            {parseErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-3">
          <p>
            <span className="font-medium">{preview.validCount}</span> filas
            válidas, <span className="font-medium">{preview.errorCount}</span>{" "}
            con errores.
          </p>
          <div className="max-h-[500px] overflow-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900">
                <tr>
                  <th className="p-2">Fila</th>
                  <th className="p-2">Estudiante</th>
                  <th className="p-2">Curso</th>
                  <th className="p-2">Apoderado</th>
                  <th className="p-2">Acción estudiante</th>
                  <th className="p-2">Acción apoderado</th>
                  <th className="p-2">Errores</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.row}
                    className={r.errors.length > 0 ? "bg-red-50 dark:bg-red-950/40" : ""}
                  >
                    <td className="p-2">{r.row}</td>
                    <td className="p-2">
                      {r.firstName} {r.lastName}
                      <br />
                      <span className="text-zinc-500 dark:text-brand-400">{r.studentIdentifier}</span>
                    </td>
                    <td className="p-2">{r.courseName}</td>
                    <td className="p-2">
                      {r.guardianName}
                      <br />
                      <span className="text-zinc-500 dark:text-brand-400">{r.guardianPhone}</span>
                    </td>
                    <td className="p-2">{r.studentAction}</td>
                    <td className="p-2">{r.guardianAction}</td>
                    <td className="p-2 text-red-700 dark:text-red-300">
                      {r.errors.join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleConfirm}
            disabled={busy || preview.validCount === 0}
            className="w-fit rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {busy ? "Importando..." : `Confirmar import (${preview.validCount} filas)`}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-md border border-green-400 bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
          {result}
        </div>
      )}
    </div>
  );
}
