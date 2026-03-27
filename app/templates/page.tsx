"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateStatus = "Active" | "Draft";
type TemplateCategory = "Legal" | "HR" | "Finance" | "Operations" | "IT" | "Compliance";

interface TemplateItem {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  fieldCount: number;
  approvalSteps: number;
  createdDate: string;
  updatedDate: string;
  status: TemplateStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryBadge(category: TemplateCategory): string {
  const map: Record<TemplateCategory, string> = {
    Legal:      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    HR:         "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    Finance:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    Operations: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    IT:         "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    Compliance: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  return map[category];
}

function statusBadge(status: TemplateStatus): string {
  return status === "Active"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200";
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/templates", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const mapped: TemplateItem[] = data.map((tpl: any) => ({
            id: tpl.id,
            name: tpl.name,
            category: "Legal" as TemplateCategory, // TODO: add to API
            description: tpl.description || "",
            fieldCount: (tpl.fields && Array.isArray(tpl.fields)) ? tpl.fields.length : 0,
            approvalSteps: tpl.approvalRoute?.steps?.length || 0,
            createdDate: new Date(tpl.createdAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            updatedDate: new Date(tpl.createdAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            status: "Active" as TemplateStatus, // TODO: add status to API
          }));
          setTemplates(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  async function handleDeleteTemplate(templateId: string, templateName: string) {
    if (!window.confirm(`Вы уверены, что хотите удалить "${templateName}"?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Не удалось удалить шаблон");
      return;
    }

    setTemplates(templates.filter((t) => t.id !== templateId));
  }

  const activeCount = templates.filter((t) => t.status === "Active").length;

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN", "USER"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Шаблоны
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Загрузка...
            </p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Шаблоны
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Управление шаблонами документов и маршрутами согласования.
          </p>
        </div>
        <Link
          href="/templates/create"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          <span className="text-[16px] leading-none font-light">+</span>
          Создать шаблон
        </Link>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Всего шаблонов",    value: templates.length },
          { label: "Активные",         value: activeCount },
          { label: "Черновики",        value: templates.length - activeCount },
          { label: "Категории",        value: new Set(templates.map((t) => t.category)).size },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-4"
          >
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Templates Table ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">

            {/* Header */}
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[32%]">
                  Название шаблона
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Категория
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Поля
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Этапы согласования
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Дата создания
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Статус
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[140px]">
                  Действия
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-zinc-100">
              {templates.map((tpl) => (
                <tr
                  key={tpl.id}
                  className="group transition-colors hover:bg-zinc-50"
                >
                  {/* Template Name + description */}
                  <td className="px-5 py-3.5">
                    <Link href={`/templates/${tpl.id}`} className="block">
                      <p className="text-[13px] font-semibold text-zinc-900 leading-snug group-hover:text-zinc-700 transition-colors">
                        {tpl.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-zinc-400 leading-snug line-clamp-1">
                        {tpl.description}
                      </p>
                    </Link>
                  </td>

                  {/* Category badge */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${categoryBadge(tpl.category)}`}
                    >
                      {({
                        Legal: "Юридический",
                        HR: "HR",
                        Finance: "Финансы",
                        Operations: "Операции",
                        IT: "ИТ",
                        Compliance: "Комплаенс",
                      } as Record<string, string>)[tpl.category] ?? tpl.category}
                    </span>
                  </td>

                  {/* Field count */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[12px] font-semibold text-zinc-600">
                      {tpl.fieldCount}
                    </span>
                  </td>

                  {/* Approval steps */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {Array.from({ length: tpl.approvalSteps }).map((_, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ml-1 text-[12px] font-medium text-zinc-500">
                        {tpl.approvalSteps}
                      </span>
                    </div>
                  </td>

                  {/* Created date */}
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">
                      {tpl.createdDate}
                    </p>
                    {tpl.updatedDate !== tpl.createdDate && (
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        Обновлено {tpl.updatedDate}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge(tpl.status)}`}
                    >
                      {tpl.status === "Active" ? "Активный" : "Черновик"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          {/* Edit */}
                          <Link
                            href={`/templates/${tpl.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                          >
                            <EditIcon />
                            Изменить
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-300"
                          >
                            <TrashIcon />
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          <p className="text-[12px] text-zinc-400">
            <span className="font-medium text-zinc-600">{templates.length}</span>{" "}
            шаблонов всего —{" "}
            <span className="font-medium text-zinc-600">{activeCount}</span> активных
          </p>
        </div>
      </div>

      </div>
    </RoleGuard>
  );
}
