"use client";

import { useState } from "react";

interface Field {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date";
  required?: boolean;
}

interface DocumentFieldsEditorProps {
  fields: Field[] | null;
  initialValues: Record<string, any> | null;
  onSave: (values: Record<string, any>) => Promise<void>;
  disabled?: boolean;
}

export function DocumentFieldsEditor({
  fields,
  initialValues,
  onSave,
  disabled = false,
}: DocumentFieldsEditorProps) {
  const [values, setValues] = useState<Record<string, any>>(
    initialValues || {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!fields || fields.length === 0) {
    return null;
  }

  function handleChange(key: string, value: any) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required fields
    const missingFields = (fields || [])
      .filter((field) => field.required && !values[field.key])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      setError(`Required fields: ${missingFields.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      await onSave(values);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">
        Document Fields
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-[12.5px] font-medium text-zinc-700 mb-1.5"
            >
              {field.label}
              {field.required && (
                <span className="text-rose-600 ml-1">*</span>
              )}
            </label>

            {field.type === "textarea" ? (
              <textarea
                id={field.key}
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                disabled={disabled || saving}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : field.type === "number" ? (
              <input
                id={field.key}
                type="number"
                value={values[field.key] || ""}
                onChange={(e) =>
                  handleChange(field.key, e.target.value ? Number(e.target.value) : "")
                }
                disabled={disabled || saving}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : field.type === "date" ? (
              <input
                id={field.key}
                type="date"
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                disabled={disabled || saving}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
              />
            ) : (
              <input
                id={field.key}
                type="text"
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                disabled={disabled || saving}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
          </div>
        ))}

        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </div>
        )}

        {!disabled && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Field Values"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
