"use client";

import { useState } from "react";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  initialData?: { name: string; description: string };
  mode: "create" | "edit";
}

export function TemplateModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: TemplateModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Название обязательно");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      onClose();
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Не удалось сохранить шаблон");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">
          {mode === "create" ? "Создать шаблон" : "Редактировать шаблон"}
        </h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          {mode === "create"
            ? "Добавить новый шаблон документа"
            : "Обновить информацию о шаблоне"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-[12.5px] font-medium text-zinc-700 mb-1.5"
            >
              Название <span className="text-rose-600">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="напр. Договор на оказание услуг"
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-[12.5px] font-medium text-zinc-700 mb-1.5"
            >
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="Краткое описание шаблона"
              disabled={submitting}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {submitting
                ? mode === "create"
                  ? "Создание..."
                  : "Сохранение..."
                : mode === "create"
                ? "Создать"
                : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
