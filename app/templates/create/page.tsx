"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

// Generate field key from label (supports Russian transliteration)
function generateFieldKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    // Транслитерация русских букв
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

// Extract variables from content (finds {{variableName}} patterns)
function extractVariablesFromContent(content: string): Field[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(regex);
  const uniqueKeys = new Set<string>();
  const fields: Field[] = [];

  for (const match of matches) {
    const key = match[1];
    if (key === "STAMP") continue; // system tag, not a user field
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      // Generate a human-readable label from camelCase key
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      fields.push({
        key,
        label,
        type: "text",
        required: true,
      });
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

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
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

export default function NewTemplatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [fields, setFields] = useState<Field[]>([]);

  // Add new field
  function addField() {
    setFields([
      ...fields,
      {
        key: "",
        label: "",
        type: "text",
        required: true,
      },
    ]);
  }

  // Update field with auto-generation of key
  function updateField(index: number, updates: Partial<Field>) {
    const newFields = [...fields];

    // If label is updated, auto-generate key
    if (updates.label !== undefined) {
      const generatedKey = generateFieldKey(updates.label);
      newFields[index] = {
        ...newFields[index],
        label: updates.label,
        key: generatedKey
      };
    } else {
      newFields[index] = { ...newFields[index], ...updates };
    }

    setFields(newFields);
  }

  // Remove field
  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  // Insert field variable into content
  function insertFieldVariable(fieldKey: string) {
    setContent(content + `{{${fieldKey}}}`);
  }

  // Import template from various file types
  async function handleFileImport(file: File) {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'json') {
        // Handle JSON files
        const text = await file.text();
        const json = JSON.parse(text);

        if (!json.name) {
          setError("Некорректный файл шаблона: отсутствует поле 'name'");
          return;
        }

        setName(json.name || "");
        setDescription(json.description || "");
        setContent(json.content || "");
        setFields(json.fields || []);
        setError(null);
      } else if (fileExtension === 'docx') {
        // Handle Word files
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        // Extract variables from content
        const extractedFields = extractVariablesFromContent(text);

        setName(file.name.replace('.docx', ''));
        setContent(text);
        setFields(extractedFields);
        setError(null);
      } else if (fileExtension === 'txt') {
        // Handle text files
        const text = await file.text();

        // Extract variables from content
        const extractedFields = extractVariablesFromContent(text);

        setName(file.name.replace('.txt', ''));
        setContent(text);
        setFields(extractedFields);
        setError(null);
      } else {
        setError("Неподдерживаемый формат файла. Загрузите файл .json, .docx или .txt");
      }
    } catch (err) {
      console.error("File import error:", err);
      setError("Не удалось обработать файл. Проверьте формат файла.");
    }
  }

  // Handle drag and drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (['json', 'docx', 'txt'].includes(fileExtension || '')) {
        handleFileImport(file);
      } else {
        setError("Загрузите файл формата .json, .docx или .txt");
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  // Handle file input
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  }

  // Submit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Название шаблона обязательно");
      return;
    }

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.key.trim()) {
        setError(`Поле #${i + 1}: Ключ обязателен`);
        return;
      }
      if (!field.label.trim()) {
        setError(`Поле #${i + 1}: Название обязательно`);
        return;
      }
      const duplicateKey = fields.find((f, idx) => idx !== i && f.key === field.key);
      if (duplicateKey) {
        setError(`Поле #${i + 1}: Дублирующийся ключ "${field.key}"`);
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          fields: fields.length > 0 ? fields : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Не удалось создать шаблон");
      }

      const template = await res.json();
      router.push(`/templates/${template.id}`);
    } catch (err) {
      console.error("Failed to create template:", err);
      setError(err instanceof Error ? err.message : "Не удалось создать шаблон");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <BackIcon />
          Назад к шаблонам
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Создать новый шаблон
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              Определите шаблон документа с полями и содержимым
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <InfoIcon />
              {showHelp ? "Скрыть справку" : "Показать справку"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Создание..." : "Создать шаблон"}
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-[14px] font-semibold text-blue-900 mb-3">
              Инструкция по созданию шаблона
            </h3>
            <div className="space-y-3 text-[13px] text-blue-800">
              <div>
                <p className="font-semibold">1. Основная информация</p>
                <p className="mt-1 text-[12px] text-blue-700">
                  Введите название шаблона и описание
                </p>
              </div>
              <div>
                <p className="font-semibold">2. Добавьте поля</p>
                <p className="mt-1 text-[12px] text-blue-700">
                  Нажмите "Добавить поле" и введите <strong>название поля</strong> (например, "Имя сотрудника").
                  Система автоматически создаст <strong>ключ поля</strong>!
                </p>
              </div>
              <div>
                <p className="font-semibold">3. Вставьте переменные</p>
                <p className="mt-1 text-[12px] text-blue-700">
                  Нажмите кнопку "Вставить в содержимое" рядом с полем, чтобы добавить его в контент документа.
                  Переменные выглядят так: {'{{employeeName}}'}
                </p>
              </div>
              <div>
                <p className="font-semibold">Совет: Импорт шаблона</p>
                <p className="mt-1 text-[12px] text-blue-700">
                  Перетащите файл (JSON, Word .docx, или .txt) в область ниже.
                  Система автоматически извлечет переменные из Word/txt файлов!
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-[13px] text-rose-700">{error}</p>
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-zinc-200 bg-zinc-50"
          } p-8 text-center cursor-pointer hover:border-zinc-300`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            <UploadIcon />
            <p className="mt-3 text-[13px] font-medium text-zinc-700">
              Импорт шаблона (JSON, Word или текст)
            </p>
            <p className="mt-1 text-[12px] text-zinc-500">
              Перетащите файл .json, .docx или .txt или нажмите для выбора
            </p>
            <p className="mt-2 text-[11px] text-emerald-600 font-medium">
              Word/текстовые файлы: переменные будут извлечены автоматически!
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4">
            Основная информация
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Название шаблона <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="напр. Заказ на закупку"
                required
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Описание
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание шаблона"
                rows={2}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">
                Поля документа
              </h2>
              <p className="mt-0.5 text-[12px] text-emerald-600">
                Введите названия полей — ключи будут сгенерированы автоматически
              </p>
            </div>
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <PlusIcon />
              Добавить поле
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-[13px] text-zinc-500">Поля еще не добавлены</p>
              <p className="mt-1 text-[12px] text-zinc-400">
                Нажмите "Добавить поле" для создания полей документа
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Название поля <span className="text-rose-500">*</span>
                        <span className="ml-1 text-[10px] text-emerald-600">автогенерация ключа</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="напр. Имя сотрудника"
                        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                      />
                      {field.key && (
                        <p className="mt-1 text-[10px] text-emerald-600">
                          Сгенерированный ключ: <code className="bg-emerald-50 px-1 rounded font-mono">{field.key}</code>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Тип
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, { type: e.target.value as Field["type"] })
                        }
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
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-[12px] text-zinc-700">Обязательное</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => insertFieldVariable(field.key)}
                        disabled={!field.key}
                        className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Вставить в содержимое
                      </button>

                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-rose-600 transition-colors hover:bg-rose-50"
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

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">
                Содержимое документа
              </h2>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Используйте кнопки "Вставить в содержимое" выше для добавления переменных полей
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
            placeholder={"Введите содержимое документа с {{переменными}}\n\nПример:\nФОРМА ЗАКАЗА\n\nПоставщик: {{vendorName}}\nСумма: {{amount}} руб.\nДата: {{orderDate}}"}
            rows={12}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-[12.5px] text-zinc-900 font-mono placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0"
          />
        </div>
      </form>
    </RoleGuard>
  );
}
