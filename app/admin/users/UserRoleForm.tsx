"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "./actions";

export default function UserRoleForm({
  userId,
  currentRole,
  roles,
  labels,
}: {
  userId: number;
  currentRole: string;
  roles: readonly string[];
  labels: Record<string, string>;
}) {
  const [role, setRole] = useState(currentRole);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("role", role);
        await updateUserRole(userId, formData);
        setMessage({ type: "success", text: "Guardado." });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Error al guardar.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setMessage(null);
          }}
          disabled={pending}
          className="input"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {labels[r]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="link-action"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {message && (
        <span
          className={
            message.type === "success"
              ? "text-xs text-green-700 dark:text-green-400"
              : "text-xs text-red-700 dark:text-red-300"
          }
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
