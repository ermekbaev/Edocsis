"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: { name: string } | null;
}

interface Position {
  id: string;
  name: string;
  description: string | null;
}

type ApproverMode = "users" | "role";

interface StepForm {
  stepNumber: number;
  name: string;
  description: string;
  approverMode: ApproverMode;
  approverRole: string;
  approverIds: string[];
  requireAll: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [steps, setSteps] = useState<StepForm[]>([]);

  const [approvers, setApprovers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        const [routeRes, usersRes, positionsRes] = await Promise.all([
          fetch(`/api/routes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/positions", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (routeRes.ok) {
          const route = await routeRes.json();
          setName(route.name);
          setDescription(route.description ?? "");
          setTemplateName(route.template?.name ?? "—");
          setSteps(
            route.steps.map((s: any) => ({
              stepNumber: s.stepNumber,
              name: s.name,
              description: s.description ?? "",
              approverMode: s.approverRole ? "role" : "users",
              approverRole: s.approverRole ?? "",
              approverIds: Array.isArray(s.approverIds) ? s.approverIds : [],
              requireAll: s.requireAll,
            }))
          );
        } else {
          setError("Маршрут не найден");
        }

        if (usersRes.ok) setApprovers(await usersRes.json());
        if (positionsRes.ok) setPositions(await positionsRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        name: "",
        description: "",
        approverMode: "users",
        approverRole: "",
        approverIds: [],
        requireAll: false,
      },
    ]);
  }

  function removeStep(index: number) {
    if (steps.length === 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    newSteps.forEach((step, i) => { step.stepNumber = i + 1; });
    setSteps(newSteps);
  }

  function updateStep(index: number, field: keyof StepForm, value: any) {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function toggleApprover(stepIndex: number, approverId: string) {
    const step = steps[stepIndex];
    const isSelected = step.approverIds.includes(approverId);
    updateStep(
      stepIndex,
      "approverIds",
      isSelected ? step.approverIds.filter((id) => id !== approverId) : [...step.approverIds, approverId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    try {
      if (!name.trim()) throw new Error("Название маршрута обязательно");
      if (steps.some((s) => !s.name.trim())) throw new Error("Все этапы должны иметь название");
      if (steps.some((s) => s.approverMode === "users" && s.approverIds.length === 0))
        throw new Error("Для всех этапов в режиме «пользователи» должен быть выбран хотя бы один согласующий");
      if (steps.some((s) => s.approverMode === "role" && !s.approverRole))
        throw new Error("Для всех этапов в режиме «по роли» должна быть выбрана роль");

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/routes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          steps: steps.map((s) => ({
            stepNumber: s.stepNumber,
            name: s.name.trim(),
            description: s.description.trim() || null,
            approverIds: s.approverMode === "users" ? s.approverIds : [],
            approverRole: s.approverMode === "role" ? s.approverRole : null,
            requireAll: s.requireAll,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Не удалось сохранить маршрут");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Загрузка...</h2>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div>
          <Link
            href="/routes"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Назад к маршрутам
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Редактирование маршрута
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Изменение настроек маршрута согласования.
          </p>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Details */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Детали маршрута</h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Название маршрута <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Описание
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none resize-none"
                  placeholder="Необязательное описание маршрута согласования"
                />
              </div>

              {/* Template — read-only */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Шаблон
                </label>
                <div className="w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-500">
                  {templateName}
                </div>
                <p className="mt-1.5 text-[11.5px] text-zinc-400">
                  Шаблон нельзя изменить после создания маршрута
                </p>
              </div>
            </div>
          </div>

          {/* Approval Steps */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-zinc-900">Этапы согласования</h3>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                <span className="text-[14px] leading-none font-light">+</span>
                Добавить этап
              </button>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[13px] font-semibold text-white">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Step Name */}
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-1">
                          Название этапа <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(index, "name", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none"
                          placeholder="напр., Согласование руководителем отдела"
                          required
                        />
                      </div>

                      {/* Step Description */}
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-1">
                          Описание этапа
                        </label>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => updateStep(index, "description", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none"
                          placeholder="Необязательное описание"
                        />
                      </div>

                      {/* Approver mode toggle */}
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-2">
                          Согласующие <span className="text-rose-500">*</span>
                        </label>
                        <div className="mb-3 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit gap-0.5">
                          {([
                            { value: "users", label: "Конкретные пользователи" },
                            { value: "role",  label: "По роли" },
                          ] as { value: ApproverMode; label: string }[]).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateStep(index, "approverMode", opt.value)}
                              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                step.approverMode === opt.value
                                  ? "bg-white text-zinc-900 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-700"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* By role */}
                        {step.approverMode === "role" && (
                          <div className="space-y-1.5">
                            <div className="relative">
                              <select
                                value={step.approverRole}
                                onChange={(e) => updateStep(index, "approverRole", e.target.value)}
                                className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-900 focus:outline-none cursor-pointer"
                              >
                                <option value="">Выберите роль из справочника…</option>
                                {positions.map((pos) => (
                                  <option key={pos.id} value={pos.id}>
                                    {pos.name}
                                  </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                              </span>
                            </div>
                            {step.approverRole && (
                              <p className="text-[11.5px] text-zinc-500">
                                Все пользователи с ролью <strong>{positions.find((p) => p.id === step.approverRole)?.name ?? step.approverRole}</strong> смогут согласовать.
                              </p>
                            )}
                          </div>
                        )}

                        {/* By specific users */}
                        {step.approverMode === "users" && (
                          <div>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
                              {approvers.length === 0 ? (
                                <p className="p-3 text-[12px] text-zinc-400">Нет пользователей в системе.</p>
                              ) : (
                                approvers.map((approver) => (
                                  <label
                                    key={approver.id}
                                    className="flex items-center gap-3 px-3 py-2 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={step.approverIds.includes(approver.id)}
                                      onChange={() => toggleApprover(index, approver.id)}
                                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-zinc-900">{approver.name}</p>
                                      <p className="text-[11.5px] text-zinc-500">
                                        {approver.email}{approver.position?.name ? ` · ${approver.position.name}` : ""}
                                      </p>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                            {step.approverIds.length > 0 && (
                              <p className="mt-1.5 text-[11.5px] text-zinc-500">
                                {step.approverIds.length} согласующ{step.approverIds.length === 1 ? "ий" : "их"} выбрано
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Require All */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.requireAll}
                            onChange={(e) => updateStep(index, "requireAll", e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span className="text-[13px] text-zinc-700">Все должны согласовать</span>
                        </label>
                        <p className="mt-1 ml-6 text-[11.5px] text-zinc-400">
                          {step.requireAll
                            ? "Все выбранные согласующие должны одобрить документ перед переходом к следующему этапу"
                            : "Любой из выбранных согласующих может одобрить документ для перехода к следующему этапу"}
                        </p>
                      </div>
                    </div>

                    {/* Remove Step */}
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
              <p className="text-[13px] text-rose-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-[13px] text-emerald-700">Маршрут успешно сохранён.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/routes"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
