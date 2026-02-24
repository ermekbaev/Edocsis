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
    DRAFT:        "Draft",
    IN_APPROVAL:  "In Approval",
    APPROVED:     "Approved",
    REJECTED:     "Rejected",
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

  useEffect(() => {
    async function loadDocument() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setError(true);
          return;
        }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[13px] text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[13px] font-mono text-zinc-400">{id}</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900">Document not found</h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          The document you&apos;re looking for does not exist or you don&apos;t have access.
        </p>
        <Link
          href="/documents"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          <BackIcon />
          Back to Documents
        </Link>
      </div>
    );
  }

  const isCurrentApprover = document.currentApproverId === currentUser?.id;

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb / Back ─────────────────────────────────────────────── */}
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <BackIcon />
          Back to Documents
        </Link>
      </div>

      {/* ── Document Header ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Title block */}
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
            { label: "Template",  value: document.template?.name || "—" },
            { label: "Initiator", value: document.initiator?.name || "—" },
            { label: "Created",   value: new Date(document.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
            {
              label: "Current Approver",
              value: document.currentApprover?.name || "—",
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
                  Document Information
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
                {document.template.content.split("\n\n").map((paragraph: string, idx: number) => {
                  // Replace template variables with actual values
                  let processedParagraph = paragraph;
                  if (document.fieldValues) {
                    Object.keys(document.fieldValues).forEach((key) => {
                      const regex = new RegExp(`{{${key}}}`, "g");
                      processedParagraph = processedParagraph.replace(regex, document.fieldValues[key]);
                    });
                  }
                  return (
                    <p
                      key={idx}
                      className="mb-4 text-[13.5px] leading-relaxed text-zinc-600 last:mb-0"
                    >
                      {processedParagraph}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column — approval panel + timeline */}
        <div className="space-y-6">

          {/* Approval Panel */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                {isCurrentApprover ? "Action Required" : "Approval Status"}
              </h3>
            </div>

            <div className="px-5 py-4">
              {isCurrentApprover ? (
                /* ── Current user is the approver ── */
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[12.5px] font-semibold text-amber-800">
                      Your approval is required
                    </p>
                    <p className="mt-0.5 text-[12px] text-amber-700">
                      You are the designated approver for this document. Please review the content and take action.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="approval-comment"
                      className="mb-1.5 block text-[12px] font-medium text-zinc-600"
                    >
                      Comment <span className="text-zinc-400">(optional)</span>
                    </label>
                    <textarea
                      id="approval-comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment or reason…"
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-zinc-900 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-zinc-200 bg-white py-2 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200"
                    >
                      Reject
                    </button>
                  </div>

                  <p className="text-center text-[11.5px] text-zinc-400">
                    This action will be logged and cannot be undone.
                  </p>
                </div>
              ) : (
                /* ── Current user is NOT the approver ── */
                <div className="space-y-3">
                  {document.status === "IN_APPROVAL" && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-[12px] font-medium text-zinc-500">
                        Awaiting approval from
                      </p>
                      <p className="mt-0.5 text-[13.5px] font-semibold text-zinc-900">
                        {document.currentApprover?.name || "—"}
                      </p>
                    </div>
                  )}
                  {document.status === "APPROVED" && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-emerald-800">
                        Document approved
                      </p>
                      <p className="mt-0.5 text-[12px] text-emerald-700">
                        This document has completed the approval process.
                      </p>
                    </div>
                  )}
                  {document.status === "REJECTED" && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-rose-800">
                        Document rejected
                      </p>
                      <p className="mt-0.5 text-[12px] text-rose-700">
                        This document was rejected. See the timeline for the reason.
                      </p>
                    </div>
                  )}
                  {document.status === "DRAFT" && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-zinc-700">
                        Draft
                      </p>
                      <p className="mt-0.5 text-[12px] text-zinc-500">
                        This document has not been submitted for approval yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Document Info */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Document Details
              </h3>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Document Number
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-zinc-700">
                  {document.number}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Created At
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-zinc-700">
                  {new Date(document.createdAt).toLocaleString("en-GB", {
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

        </div>
      </div>
    </div>
  );
}
