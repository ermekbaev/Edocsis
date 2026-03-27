"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { RoleGuard } from "@/app/components/role-guard";
import mammoth from "mammoth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Field {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  required: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateFieldKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[а-яё]/gi, (match) => {
      const ru: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
        ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
        н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
        ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
        ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return ru[match.toLowerCase()] || match;
    })
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function extractVariablesFromContent(content: string): Field[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(regex);
  const uniqueKeys = new Set<string>();
  const fields: Field[] = [];
  for (const match of matches) {
    const key = match[1];
    if (key === "STAMP") continue;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      fields.push({ key, label, type: "text", required: true });
    }
  }
  return fields;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/templates/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setLoadError(res.status === 404 ? "Шаблон не найден" : "Не удалось загрузить шаблон");
          return;
        }
        const data = await res.json();
        setName(data.name || "");
        setDescription(data.description || "");
        setContent(data.content || "");
        setFields(Array.isArray(data.fields) ? data.fields : []);
      } catch {
        setLoadError("Не удалось загрузить шаблон");
      } finally {
        setLoadingTemplate(false);
      }
    }
    fetchTemplate();
  }, [templateId]);

  function addField() {
    setFields([...fields, { key: "", label: "", type: "text", required: true }]);
  }

  function updateField(index: number, updates: Partial<Field>) {
    const newFields = [...fields];
    if (updates.label !== undefined) {
      newFields[index] = { ...newFields[index], label: updates.label, key: generateFieldKey(updates.label) };
    } else {
      newFields[index] = { ...newFields[index], ...updates };
    }
    setFields(newFields);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  function insertFieldVariable(fieldKey: string) {
    setContent(content + `{{${fieldKey}}}`);
  }

  async function handleFileImport(file: File) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "json") {
        const json = JSON.parse(await file.text());
        if (json.name) setName(json.name);
        if (json.description) setDescription(json.description);
        if (json.content) setContent(json.content);
        if (json.fields) setFields(json.fields);
      } else if (ext === "docx") {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setContent(result.value);
        setFields(extractVariablesFromContent(result.value));
      } else if (ext === "txt") {
        const text = await file.text();
        setContent(text);
        setFields(extractVariablesFromContent(text));
      } else {
        setSaveError("Поддерживаются файлы .json, .docx или .txt");
      }
    } catch {
      setSaveError("Не удалось обработать файл");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileImport(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    if (!name.trim()) { setSaveError("Название шаблона обязательно"); return; }

    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].key.trim()) { setSaveError(`Поле #${i + 1}: ключ обязателен`); return; }
      if (!fields[i].label.trim()) { setSaveError(`Поле #${i + 1}: название обязательно`); return; }
      if (fields.find((f, idx) => idx !== i && f.key === fields[i].key)) {
        setSaveError(`Поле #${i + 1}: дублирующийся ключ "${fields[i].key}"`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          fields: fields.length > 0 ? fields : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Не удалось сохранить шаблон");
      }
      router.push(`/templates/${templateId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Не удалось сохранить шаблон");
    } finally {
      setSaving(false);
    }
  }

  if (loadingTemplate) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Загрузка...</h2>
        </div>
      </RoleGuard>
    );
  }

  if (loadError) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <Link href="/templates" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 hover:text-zinc-700">
            <BackIcon />Назад к шаблонам
          </Link>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-4">
            <p className="text-[14px] text-rose-700">{loadError}</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Link href={`/templates/${templateId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 hover:text-zinc-700">
          <BackIcon />Назад к шаблону
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Редактировать шаблон</h1>
            <p className="mt-1 text-[14px] text-zinc-500">Измените содержимое, поля и описание шаблона</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>

        {saveError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-[13px] text-rose-700">{saveError}</p>
          </div>
        )}

        {/* File import */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`rounded-xl border-2 border-dashed transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-zinc-200 bg-zinc-50"} p-6 text-center cursor-pointer hover:border-zinc-300`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".json,.docx,.txt" onChange={(e) => { if (e.target.files?.[0]) handleFileImport(e.target.files[0]); }} className="hidden" />
          <div className="flex flex-col items-center">
            <UploadIcon />
            <p className="mt-2 text-[13px] font-medium text-zinc-700">Импортировать из файла (JSON, Word, TXT)</p>
            <p className="mt-0.5 text-[11.5px] text-zinc-400">Заменит текущее содержимое и поля</p>
          </div>
        </div>

        {/* Basic info */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4">Основная информация</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Название шаблона <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" id="name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-[13px] font-medium text-zinc-700 mb-1.5">Описание</label>
              <textarea
                id="description" value={description} rows={2}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Поля документа</h2>
              <p className="mt-0.5 text-[12px] text-emerald-600">Введите названия полей — ключи сгенерируются автоматически</p>
            </div>
            <button type="button" onClick={addField} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50">
              <PlusIcon />Добавить поле
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-[13px] text-zinc-500">Поля не добавлены</p>
              <p className="mt-1 text-[12px] text-zinc-400">Нажмите "Добавить поле" для создания полей документа</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Название поля <span className="text-rose-500">*</span>
                        <span className="ml-1 text-[10px] text-emerald-600">автогенерация ключа</span>
                      </label>
                      <input
                        type="text" value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="напр. Имя сотрудника"
                        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] text-zinc-900 focus:border-zinc-400 focus:outline-none"
                      />
                      {field.key && (
                        <p className="mt-1 text-[10px] text-emerald-600">
                          Ключ: <code className="bg-emerald-50 px-1 rounded font-mono">{field.key}</code>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">Тип</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as Field["type"] })}
                        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] text-zinc-900 focus:border-zinc-400 focus:outline-none"
                      >
                        <option value="text">Текст</option>
                        <option value="textarea">Текстовая область</option>
                        <option value="date">Дата</option>
                        <option value="number">Число</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox" checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        <span className="text-[12px] text-zinc-700">Обязательное</span>
                      </label>
                      <button
                        type="button" onClick={() => insertFieldVariable(field.key)} disabled={!field.key}
                        className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Вставить в содержимое
                      </button>
                      <button
                        type="button" onClick={() => removeField(index)}
                        className="rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-rose-600 hover:bg-rose-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Содержимое документа</h2>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Используйте {'{{ключПоля}}'} для вставки переменных. Кнопка "Вставить в содержимое" добавит переменную автоматически.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContent(content + "\n{{STAMP}}")}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              title="Вставить тег {{STAMP}} — место где появится штамп подписи"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
              </svg>
              Вставить место для штампа
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Введите содержимое документа...\n\nПример:\nДокумент №{{number}}\nДата: {{date}}\nСотрудник: {{employeeName}}"}
            rows={14}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-[12.5px] text-zinc-900 font-mono focus:border-zinc-400 focus:outline-none"
          />
        </div>

        {/* Bottom save button */}
        <div className="flex justify-end gap-3 pb-4">
          <Link
            href={`/templates/${templateId}`}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </RoleGuard>
  );
}
