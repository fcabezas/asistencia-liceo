import { db } from "@/db";
import { studentTags } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { TAG_TYPE_LABELS } from "@/lib/student-tags";
import { addStudentTag, removeStudentTag } from "@/app/inspector/students/actions";
import { TrashIcon } from "@/components/icons";

export default async function StudentTagsManager({ studentId }: { studentId: number }) {
  const tags = await db
    .select()
    .from(studentTags)
    .where(eq(studentTags.studentId, studentId))
    .orderBy(asc(studentTags.tagType));

  return (
    <div>
      <p className="font-medium">Etiquetas</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-brand-300">
        Pase de ingreso, condición especial, internado, colación. La hora límite solo aplica a
        pase de ingreso y es informativa (no bloquea ni suprime avisos automáticamente). Vigencia
        es opcional: déjala vacía si la etiqueta no tiene fecha de término.
      </p>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm dark:divide-brand-800 dark:border-brand-800">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 p-2">
              <span>
                <span className="font-medium">{TAG_TYPE_LABELS[t.tagType] ?? t.tagType}</span>
                {t.label && <> — {t.label}</>}
                {t.untilTime && <> (hasta las {t.untilTime})</>}
                {t.notes && <span className="block text-xs text-zinc-500 dark:text-brand-300">{t.notes}</span>}
                {(t.validFrom || t.validUntil) && (
                  <span className="block text-xs text-zinc-500 dark:text-brand-300">
                    Vigencia: {t.validFrom ?? "sin inicio"} a {t.validUntil ?? "sin término"}
                  </span>
                )}
              </span>
              <form action={removeStudentTag.bind(null, t.id, studentId)}>
                <button className="btn-danger" type="submit">
                  <TrashIcon className="h-3.5 w-3.5" />
                  Quitar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        action={addStudentTag.bind(null, studentId)}
        className="mt-4 flex flex-wrap items-end gap-2 text-sm"
      >
        <div>
          <label className="label">Tipo</label>
          <select name="tagType" className="input" required>
            {Object.entries(TAG_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Etiqueta / detalle corto</label>
          <input name="label" type="text" placeholder="Ej. Fútbol selección" className="input" />
        </div>
        <div>
          <label className="label">Hora límite (solo pase de ingreso)</label>
          <input name="untilTime" type="time" className="input" />
        </div>
        <div>
          <label className="label">Notas</label>
          <input name="notes" type="text" placeholder="Detalle adicional" className="input" />
        </div>
        <div>
          <label className="label">Vigente desde (opcional)</label>
          <input name="validFrom" type="date" className="input" />
        </div>
        <div>
          <label className="label">Vigente hasta (opcional)</label>
          <input name="validUntil" type="date" className="input" />
        </div>
        <button type="submit" className="btn-primary">
          Agregar
        </button>
      </form>
    </div>
  );
}
