"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "DRAFT" | "IN_APPROVAL" | "APPROVED" | "REJECTED";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    DRAFT:        "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
    IN_APPROVAL:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    APPROVED:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    REJECTED:     "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  return map[status];
}

function statusLabel(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    DRAFT:        "Черновик",
    IN_APPROVAL:  "На согласовании",
    APPROVED:     "Согласовано",
    REJECTED:     "Отклонено",
  };
  return map[status];
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const currentUser = useCurrentUser();

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [newStatus, setNewStatus] = useState<DocStatus | "">("");

  useEffect(() => {
    async function loadDocument() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/documents/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setDocument(data);
      } catch (err) {
        console.error("Failed to load document:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadDocument();
  }, [id]);

  async function handleApprove() {
    setActionLoading(true);
    setActionError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Не удалось согласовать");
        return;
      }
      setDocument(data);
      setComment("");
    } catch {
      setActionError("Не удалось согласовать документ");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!comment.trim()) {
      setActionError("При отклонении необходимо указать комментарий");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Не удалось отклонить");
        return;
      }
      setDocument(data);
      setComment("");
    } catch {
      setActionError("Не удалось отклонить документ");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!newStatus || newStatus === document.status) return;
    setStatusChanging(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Не удалось изменить статус");
        return;
      }
      setDocument({ ...document, status: data.status });
      setNewStatus("");
    } catch {
      setActionError("Не удалось изменить статус");
    } finally {
      setStatusChanging(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[13px] text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[13px] font-mono text-zinc-400">{id}</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900">Документ не найден</h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Документ, который вы ищете, не существует или у вас нет доступа.
        </p>
        <Link
          href="/documents"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          <BackIcon />
          Назад к документам
        </Link>
      </div>
    );
  }

  // Check if current user has a pending approval for the current step
  const myPendingApproval = document.approvals?.find(
    (a: any) =>
      a.approverId === currentUser?.id &&
      a.status === "PENDING" &&
      (document.currentStepNumber !== null
        ? a.stepNumber === document.currentStepNumber
        : a.stepNumber === null)
  );
  const isCurrentApprover = Boolean(myPendingApproval) && document.status === "IN_APPROVAL";

  // For multi-step: find the current step config
  const approvalRoute = document.template?.approvalRoute;
  const currentStep = approvalRoute?.steps?.find(
    (s: any) => s.stepNumber === document.currentStepNumber
  );

  // Approvals for the current step (for "X of Y approved" display)
  const currentStepApprovals = document.approvals?.filter(
    (a: any) => a.stepNumber === document.currentStepNumber
  ) ?? [];

  function handleDownloadDoc() {
    if (!document) return;

    let text = document.template?.content || "";
    text = text.replace(/\\n/g, "\n");
    if (document.fieldValues) {
      Object.keys(document.fieldValues).forEach((key: string) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        text = text.replace(regex, document.fieldValues[key] ?? "");
      });
    }
    // Replace {{STAMP}} with actual stamp(s) based on approvals
    const approvedForDoc = (document.approvals || []).filter((a: any) => a.status === "APPROVED");
    let stampIdx = 0;
    text = text.replace(/\{\{STAMP\}\}/g, () => {
      const a = approvedForDoc[stampIdx++];
      if (a) {
        const name = a.approver?.name || "—";
        const pos = a.approver?.position?.name || a.approver?.department || "—";
        const date = a.decidedAt ? new Date(a.decidedAt).toLocaleDateString("ru-RU") : "—";
        return `<table style="border-collapse:collapse;margin:16px 0;font-family:Arial,sans-serif"><tr><td style="border:2px solid #142872;padding:0;min-width:260px"><div style="background:#142872;color:#fff;text-align:center;padding:7px 14px;font-weight:bold;font-size:13px;letter-spacing:1px">СОГЛАСОВАНО</div><div style="background:#f8f8fa;padding:10px 14px;font-size:12px;line-height:2"><span style="color:#888">Владелец:</span> ${name}<br><span style="color:#888">Должность:</span> ${pos}<br><span style="color:#888">Дата:</span> ${date}<br><span style="color:#888">Документ:</span> <span style="color:#888;font-size:11px">${document.number}</span></div></td></tr></table>`;
      }
      return `<table style="border-collapse:collapse;margin:16px 0;font-family:Arial,sans-serif;opacity:0.5"><tr><td style="border:2px dashed #ccc;padding:0;min-width:260px"><div style="background:#ccc;color:#fff;text-align:center;padding:7px 14px;font-weight:bold;font-size:13px;letter-spacing:1px">СОГЛАСОВАНО</div><div style="background:#f8f8fa;padding:10px 14px;font-size:12px;line-height:2;color:#999">Владелец: _______________<br>Должность: _______________<br>Дата: _______________<br>Документ: _______________</div></td></tr></table>`;
    });
    text = text.replace(/\{\{[^}]+\}\}/g, "");

    const completedApprovals = (document.approvals || []).filter(
      (a: any) => a.status !== "PENDING"
    );

    const stampsHtml = "";

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${document.title}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 30mm 25mm; color: #000; }
  h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #666; text-align: center; margin-bottom: 20px; }
  pre { font-family: 'Times New Roman', serif; font-size: 13px; white-space: pre-wrap; line-height: 1.6; }
</style>
</head>
<body>
  <h1>${document.title}</h1>
  <div class="meta">${document.number} · Инициатор: ${document.initiator?.name || "—"}</div>
  <hr/>
  <pre>${text}</pre>
  ${stampsHtml}
</body>
</html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title.replace(/[^а-яёa-z0-9\s]/gi, "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb / Back ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <BackIcon />
          Назад к документам
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/documents/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Сохранить PDF
          </a>
          <button
            type="button"
            onClick={handleDownloadDoc}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Скачать DOC
          </button>
        </div>
      </div>

      {/* ── Document Header ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[12px] text-zinc-400">{document.number || document.id}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(document.status)}`}
              >
                {statusLabel(document.status)}
              </span>
            </div>
            <h1 className="mt-2 text-[20px] font-semibold tracking-tight text-zinc-900 leading-snug">
              {document.title}
            </h1>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-zinc-100 pt-5 sm:grid-cols-4">
          {[
            { label: "Шаблон",  value: document.template?.name || "—" },
            { label: "Инициатор", value: document.initiator?.name || "—" },
            { label: "Создано",   value: new Date(document.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }) },
            {
              label: document.currentStepNumber
                ? `Согласующий (Этап ${document.currentStepNumber})`
                : "Текущий согласующий",
              value: document.currentStepNumber
                ? (document.approvals ?? [])
                    .filter((a: { stepNumber: number }) => a.stepNumber === document.currentStepNumber)
                    .map((a: { approver: { name: string } }) => a.approver.name)
                    .join(", ") || "—"
                : document.currentApprover?.name || "—",
              highlight: document.status === "IN_APPROVAL",
            },
          ].map(({ label, value, highlight }) => (
            <div key={label}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                {label}
              </p>
              <p
                className={`mt-0.5 text-[13px] font-medium ${
                  highlight ? "text-amber-700" : "text-zinc-700"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Left column — fields + content */}
        <div className="xl:col-span-2 space-y-6">

          {/* Document Fields */}
          {document.template?.fields && Array.isArray(document.template.fields) && document.template.fields.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  Информация о документе
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-px bg-zinc-100 sm:grid-cols-2">
                {document.template.fields.map((field: any) => (
                  <div key={field.key} className="bg-white px-6 py-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                      {field.label}
                    </p>
                    <p className="mt-0.5 text-[13.5px] font-medium text-zinc-800">
                      {document.fieldValues?.[field.key] || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Content */}
          {document.template?.content && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  {document.title}
                </h3>
              </div>
              <div className="px-6 py-5">
                {(() => {
                  let text = document.template.content.replace(/\\n/g, "\n");
                  if (document.fieldValues) {
                    Object.keys(document.fieldValues).forEach((key) => {
                      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
                      text = text.replace(regex, document.fieldValues[key] ?? "");
                    });
                  }
                  // Clear remaining field vars but preserve {{STAMP}}
                  text = text.replace(/\{\{(?!STAMP\}\})[^}]+\}\}/g, "");

                  const approvedApprovals = (document.approvals || []).filter(
                    (a: any) => a.status === "APPROVED"
                  );
                  const parts = text.split("{{STAMP}}");

                  return parts.map((part: string, i: number) => (
                    <span key={i}>
                      <pre className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed text-zinc-600">
                        {part}
                      </pre>
                      {i < parts.length - 1 && (
                        approvedApprovals[i] ? (
                          /* Actual stamp — official table-style */
                          <table className="my-4 border-collapse" style={{ fontFamily: "'Times New Roman', serif" }}>
                            <tbody>
                              <tr>
                                <td className="border border-zinc-500 px-4 py-3 text-[12px] leading-[1.8] min-w-[260px]">
                                  <strong>Документ подписан электронной подписью</strong><br />
                                  Владелец: {approvedApprovals[i].approver?.name || "—"}<br />
                                  Должность: {approvedApprovals[i].approver?.position?.name || approvedApprovals[i].approver?.department || "—"}<br />
                                  Дата подписи: {approvedApprovals[i].decidedAt
                                    ? new Date(approvedApprovals[i].decidedAt).toLocaleDateString("ru-RU")
                                    : "—"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          /* Placeholder stamp */
                          <table className="my-4 border-collapse opacity-50" style={{ fontFamily: "'Times New Roman', serif" }}>
                            <tbody>
                              <tr>
                                <td className="border border-dashed border-zinc-400 px-4 py-3 text-[12px] leading-[1.8] text-zinc-400 min-w-[260px]">
                                  <strong>Документ подписан электронной подписью</strong><br />
                                  Владелец: _______________<br />
                                  Должность: _______________<br />
                                  Дата подписи: _______________
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )
                      )}
                    </span>
                  ));
                })()}
              </div>

              {/* ── Approval Stamps ── */}
              {document.approvals && document.approvals.some((a: any) => a.status !== "PENDING") && (
                <div className="border-t border-zinc-100 px-6 py-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Подписи согласования
                  </p>

                  {/* Stamp table — bordered rectangular cells in a row */}
                  <div className="flex flex-wrap border border-zinc-400 divide-x divide-zinc-400">
                    {document.approvals
                      .filter((a: any) => a.status !== "PENDING")
                      .map((a: any, idx: number) => (
                        <div
                          key={`${a.approverId}-${idx}`}
                          className="flex-1 min-w-[180px] px-4 py-3 font-['Times_New_Roman',serif]"
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wider pb-1 mb-2 border-b ${
                            a.status === "APPROVED"
                              ? "text-zinc-700 border-zinc-300"
                              : "text-rose-700 border-rose-200"
                          }`}>
                            {a.status === "APPROVED" ? "Документ подписан" : "Отклонено"}
                            {a.stepNumber ? ` · Этап ${a.stepNumber}` : ""}
                          </p>
                          <p className="text-[12px] font-semibold text-zinc-800 leading-snug">
                            {a.approver?.name || "—"}
                          </p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">
                            {a.approver?.position?.name || a.approver?.department || "—"}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-1.5">
                            Дата:{" "}
                            {a.decidedAt
                              ? new Date(a.decidedAt).toLocaleDateString("ru-RU", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                })
                              : "___.____.______"}
                          </p>
                          {a.comment && (
                            <p className={`mt-1.5 text-[11px] italic ${
                              a.status === "APPROVED" ? "text-zinc-500" : "text-rose-600"
                            }`}>
                              «{a.comment}»
                            </p>
                          )}
                        </div>
                      ))}
                  </div>

                  {document.status === "APPROVED" && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <p className="text-[12px] font-semibold text-emerald-800">
                        Документ полностью согласован —{" "}
                        {new Date(document.updatedAt || document.createdAt).toLocaleDateString("ru-RU", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attached Files — shown after approval result */}
          {document.files && document.files.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  Вложения
                </h3>
              </div>
              <ul className="divide-y divide-zinc-100">
                {document.files.map((file: any) => {
                  const sizeKb = (file.size / 1024).toFixed(1);
                  return (
                    <li key={file.id} className="flex items-center gap-3 px-6 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/api/files/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[13px] font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
                        >
                          {file.name}
                        </a>
                        <p className="text-[11.5px] text-zinc-400">
                          {sizeKb} КБ
                          {file.user?.name ? ` · ${file.user.name}` : ""}
                          {" · "}{new Date(file.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right column — approval panel + details */}
        <div className="space-y-6">

          {/* Approval Panel */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                {isCurrentApprover ? "Требуется действие" : "Статус согласования"}
              </h3>
            </div>

            <div className="px-5 py-4">
              {isCurrentApprover ? (
                /* ── Current user must approve ── */
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[12.5px] font-semibold text-amber-800">
                      Требуется ваше согласование
                    </p>
                    {currentStep && (
                      <p className="mt-0.5 text-[12px] text-amber-700">
                        Этап {currentStep.stepNumber}: {currentStep.name}
                        {currentStep.requireAll && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            Все должны согласовать
                          </span>
                        )}
                      </p>
                    )}
                    {!currentStep && (
                      <p className="mt-0.5 text-[12px] text-amber-700">
                        Пожалуйста, рассмотрите и примите решение.
                      </p>
                    )}
                  </div>

                  {/* Progress within step (for requireAll steps) */}
                  {currentStep?.requireAll && currentStepApprovals.length > 1 && (
                    <div className="text-[12px] text-zinc-500">
                      {currentStepApprovals.filter((a: any) => a.status === "APPROVED").length} из {currentStepApprovals.length} согласующих одобрили
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="approval-comment"
                      className="mb-1.5 block text-[12px] font-medium text-zinc-600"
                    >
                      Комментарий{" "}
                      <span className="text-zinc-400">(обязателен при отклонении)</span>
                    </label>
                    <textarea
                      id="approval-comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Добавить комментарий или причину…"
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  {actionError && (
                    <p className="text-[12px] text-rose-600">{actionError}</p>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg bg-zinc-900 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Обработка…" : "Согласовать"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white py-2 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Обработка…" : "Отклонить"}
                    </button>
                  </div>

                  <p className="text-center text-[11.5px] text-zinc-400">
                    Это действие будет записано и не может быть отменено.
                  </p>
                </div>
              ) : (
                /* ── Current user is NOT the approver ── */
                <div className="space-y-3">
                  {document.status === "IN_APPROVAL" && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-[12px] font-medium text-zinc-500">
                        Ожидает согласования от
                      </p>
                      <p className="mt-0.5 text-[13.5px] font-semibold text-zinc-900">
                        {document.currentApprover?.name || "—"}
                      </p>
                      {currentStep && (
                        <p className="mt-1 text-[11.5px] text-zinc-400">
                          Этап {currentStep.stepNumber}: {currentStep.name}
                        </p>
                      )}
                    </div>
                  )}
                  {document.status === "APPROVED" && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-emerald-800">
                        Документ согласован
                      </p>
                      <p className="mt-0.5 text-[12px] text-emerald-700">
                        Этот документ прошёл процесс согласования.
                      </p>
                    </div>
                  )}
                  {document.status === "REJECTED" && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-rose-800">
                        Документ отклонён
                      </p>
                      {(() => {
                        const rejectedApproval = document.approvals?.find(
                          (a: any) => a.status === "REJECTED"
                        );
                        return rejectedApproval?.comment ? (
                          <p className="mt-0.5 text-[12px] text-rose-700">
                            Причина: {rejectedApproval.comment}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[12px] text-rose-700">
                            Этот документ был отклонён.
                          </p>
                        );
                      })()}
                    </div>
                  )}
                  {document.status === "DRAFT" && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-zinc-700">Черновик</p>
                      <p className="mt-0.5 text-[12px] text-zinc-500">
                        Этот документ ещё не отправлен на согласование.
                      </p>
                    </div>
                  )}

                  {/* Approval history for multi-step */}
                  {approvalRoute && document.approvals?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {approvalRoute.steps.map((step: any) => {
                        const stepApprovals = document.approvals.filter(
                          (a: any) => a.stepNumber === step.stepNumber
                        );
                        const anyDone = stepApprovals.some(
                          (a: any) => a.status !== "PENDING"
                        );
                        if (!anyDone) return null;
                        return (
                          <div key={step.stepNumber} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                            <p className="text-[11.5px] font-semibold text-zinc-700">
                              Этап {step.stepNumber}: {step.name}
                            </p>
                            {stepApprovals.map((a: any) => (
                              <div key={a.approverId} className="mt-1 flex items-center gap-1.5">
                                <span className={`inline-block h-1.5 w-1.5 rounded-full ${a.status === "APPROVED" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                <span className="text-[11.5px] text-zinc-600">
                                  {a.approver?.name} — {a.status === "APPROVED" ? "Согласовано" : "Отклонено"}
                                  {a.comment && <span className="text-zinc-400"> ({a.comment})</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Document Details */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Детали документа
              </h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Номер документа
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-zinc-700">
                  {document.number}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Дата создания
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-zinc-700">
                  {new Date(document.createdAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Admin: Manual Status Change */}
          {currentUser?.role === "ADMIN" && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  Управление администратора
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  Изменить статус документа вручную.
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as DocStatus | "")}
                    className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">Выберите новый статус…</option>
                    {(["DRAFT", "IN_APPROVAL", "APPROVED", "REJECTED"] as DocStatus[])
                      .filter((s) => s !== document.status)
                      .map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                </div>
                {actionError && (
                  <p className="text-[12px] text-rose-600">{actionError}</p>
                )}
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={!newStatus || statusChanging}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {statusChanging ? "Изменение…" : "Изменить статус"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
