"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "Urgent" | "Normal";

interface PendingDocument {
  id: string;
  approvalId: string;
  title: string;
  template: string;
  initiator: string;
  submittedDate: string;
  daysWaiting: number;
  priority: Priority;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function ViewIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  async function fetchApprovals() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/approvals/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const mapped: PendingDocument[] = data.map((approval: any) => ({
          id: approval.documentNumber,
          approvalId: approval.id,
          title: approval.documentTitle,
          template: "—",
          initiator: approval.initiatorName,
          submittedDate: "—",
          daysWaiting: 0,
          priority: "Normal" as Priority,
        }));
        setDocuments(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    }
  }

  async function handleDecision(approvalId: string, action: "approve" | "reject") {
    setProcessing((prev) => new Set(prev).add(approvalId));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/approvals/${approvalId}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await fetchApprovals();
      } else {
        const error = await res.json();
        console.error("Decision failed:", error);
      }
    } catch (err) {
      console.error("Failed to submit decision:", err);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(approvalId);
        return next;
      });
    }
  }

  useEffect(() => {
    fetchApprovals();
  }, []);

  const urgentCount = documents.filter(
    (d) => d.priority === "Urgent",
  ).length;

  return (
    <RoleGuard allowedRoles={["ADMIN", "APPROVER"]}>
      <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            My Approvals
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Documents waiting for your decision.
          </p>
        </div>

        {/* Pending count pill */}
        <div className="shrink-0 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-amber-800">
            {documents.length} pending
          </span>
          {urgentCount > 0 && (
            <>
              <span className="text-amber-300" aria-hidden="true">·</span>
              <span className="text-[13px] font-medium text-rose-600">
                {urgentCount} urgent
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Approvals Table ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">

        {/* Overflow wrapper for mobile horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">

            {/* Table header */}
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[28%]">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Initiator
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[120px]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[200px]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody className="divide-y divide-zinc-100">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="group transition-colors hover:bg-zinc-50"
                >
                  {/* Title + ID */}
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold text-zinc-900 leading-snug">
                      {doc.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[11.5px] font-mono text-zinc-400">
                        {doc.id}
                      </p>
                      {doc.priority === "Urgent" && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-rose-200">
                          Urgent
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Template */}
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">
                      {doc.template}
                    </p>
                  </td>

                  {/* Initiator */}
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] text-zinc-600 whitespace-nowrap">
                      {doc.initiator}
                    </p>
                  </td>

                  {/* Submitted date + days waiting */}
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] text-zinc-600 whitespace-nowrap">
                      {doc.submittedDate}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] font-medium ${
                        doc.daysWaiting >= 7
                          ? "text-rose-500"
                          : doc.daysWaiting >= 3
                          ? "text-amber-500"
                          : "text-zinc-400"
                      }`}
                    >
                      {daysLabel(doc.daysWaiting)}
                    </p>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">
                      In Approval
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve */}
                      <button
                        type="button"
                        onClick={() => handleDecision(doc.approvalId, "approve")}
                        disabled={processing.has(doc.approvalId)}
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-zinc-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        onClick={() => handleDecision(doc.approvalId, "reject")}
                        disabled={processing.has(doc.approvalId)}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>

                      {/* View */}
                      <Link
                        href={`/documents/${doc.id}`}
                        title="View document"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
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

        {/* Table footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          <p className="text-[12px] text-zinc-400">
            Showing{" "}
            <span className="font-medium text-zinc-600">
              {documents.length}
            </span>{" "}
            documents awaiting your approval
          </p>
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
