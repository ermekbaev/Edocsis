"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalItem {
  id: string;
  documentId: string;
  documentNumber: string;
  title: string;
  initiator: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  documentStatus: string;
  stepNumber: number | null;
  comment: string | null;
  decidedAt: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  async function fetchApprovals() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/approvals/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: ApprovalItem[] = data.map((a: any) => ({
          id: a.id,
          documentId: a.documentId,
          documentNumber: a.documentNumber,
          title: a.documentTitle,
          initiator: a.initiatorName,
          approvalStatus: a.approvalStatus,
          documentStatus: a.documentStatus,
          stepNumber: a.stepNumber ?? null,
          comment: a.comment ?? null,
          decidedAt: a.decidedAt ?? null,
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    }
  }

  async function handleDecision(approvalId: string, documentId: string, action: "approve" | "reject") {
    setProcessing((prev) => new Set(prev).add(approvalId));
    try {
      const token = localStorage.getItem("token");
      const endpoint = action === "approve"
        ? `/api/documents/${documentId}/approve`
        : `/api/documents/${documentId}/reject`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchApprovals();
      } else {
        const err = await res.json();
        console.error("Decision failed:", err);
      }
    } catch (err) {
      console.error("Failed to submit decision:", err);
    } finally {
      setProcessing((prev) => { const n = new Set(prev); n.delete(approvalId); return n; });
    }
  }

  useEffect(() => { fetchApprovals(); }, []);

  const pending = items.filter((i) => i.approvalStatus === "PENDING");
  const completed = items.filter((i) => i.approvalStatus !== "PENDING");

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Мои согласования
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Документы на вашем рассмотрении.
            </p>
          </div>
          {pending.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[13px] font-semibold text-amber-800">
                {pending.length} ожидает решения
              </span>
            </div>
          )}
        </div>

        {/* ── Pending ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">Ожидают решения</h3>
          </div>

          {pending.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] text-zinc-400">Нет документов, ожидающих вашего решения</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Название</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Инициатор</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Этап</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[220px]">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pending.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-zinc-900">{doc.title}</p>
                        <p className="text-[11.5px] font-mono text-zinc-400">{doc.documentNumber}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] text-zinc-600">{doc.initiator}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] text-zinc-500">
                          {doc.stepNumber ? `Этап ${doc.stepNumber}` : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecision(doc.id, doc.documentId, "approve")}
                            disabled={processing.has(doc.id)}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            Согласовать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(doc.id, doc.documentId, "reject")}
                            disabled={processing.has(doc.id)}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            Отклонить
                          </button>
                          <Link
                            href={`/documents/${doc.documentId}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <ViewIcon />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Completed ──────────────────────────────────────────────────── */}
        {completed.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">Рассмотренные</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Название</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Инициатор</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Решение</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Дата</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {completed.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-zinc-900">{doc.title}</p>
                        <p className="text-[11.5px] font-mono text-zinc-400">{doc.documentNumber}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] text-zinc-600">{doc.initiator}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {doc.approvalStatus === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            Согласовано
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                            Отклонено
                          </span>
                        )}
                        {doc.comment && (
                          <p className="mt-0.5 text-[11.5px] italic text-zinc-400">«{doc.comment}»</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] text-zinc-500">
                          {doc.decidedAt
                            ? new Date(doc.decidedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/documents/${doc.documentId}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 ml-auto"
                        >
                          <ViewIcon />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
