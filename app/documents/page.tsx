"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchIcon } from "../components/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "Draft" | "In Approval" | "Approved" | "Rejected";

interface Document {
  id: string;
  number: string;
  title: string;
  template: string;
  status: DocStatus;
  initiator: string;
  createdDate: string;
  currentApprover: string;
}

const STATUS_OPTIONS: Array<DocStatus | "All"> = [
  "All",
  "Draft",
  "In Approval",
  "Approved",
  "Rejected",
];

const TEMPLATE_OPTIONS = [
  "All Templates",
  "Service Contract",
  "Transfer Order",
  "Non-Disclosure Agreement",
  "Budget Memo",
  "Vendor Form",
  "HR Contract",
  "License Agreement",
  "Real Estate Contract",
  "DPA Template",
  "Policy Document",
  "Subcontractor Agreement",
  "Compliance Form",
];

const INITIATOR_OPTIONS = [
  "All Initiators",
  "Adil Kaliyev",
  "Sergey Lebedev",
  "Maria Kuznetsova",
  "Dmitry Ryabov",
  "Nikita Korobov",
  "HR Department",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    Draft:         "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
    "In Approval": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    Approved:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Rejected:      "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  return map[status];
}

function DotsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "All">("All");
  const [templateFilter, setTemplateFilter] = useState("All Templates");
  const [initiatorFilter, setInitiatorFilter] = useState("All Initiators");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const token = localStorage.getItem("token");

        // Build query params
        const params = new URLSearchParams();
        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }
        if (statusFilter !== "All") {
          const apiStatus = statusFilter === "Draft" ? "DRAFT" : statusFilter === "In Approval" ? "IN_APPROVAL" : statusFilter === "Approved" ? "APPROVED" : "REJECTED";
          params.append("status", apiStatus);
        }

        const url = `/api/documents${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          // Map API response to UI format
          const mapped = data.map((doc: any) => ({
            id: doc.id,
            number: doc.number,
            title: doc.title,
            template: doc.template?.name || "—",
            status: doc.status === "DRAFT" ? "Draft" : doc.status === "IN_APPROVAL" ? "In Approval" : doc.status === "APPROVED" ? "Approved" : "Rejected",
            initiator: doc.initiator?.name || "—",
            createdDate: new Date(doc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
            currentApprover: doc.currentApprover?.name || "—",
          }));
          setDocuments(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    }
    fetchDocuments();
  }, [debouncedSearch, statusFilter]);

  async function handleDeleteDocument(documentId: string, documentTitle: string) {
    if (!window.confirm(`Are you sure you want to delete "${documentTitle}"?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Failed to delete document");
      return;
    }

    setDocuments(documents.filter((d) => d.id !== documentId));
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Documents
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Manage and track all organization documents across approval workflows.
          </p>
        </div>
        <Link
          href="/documents/create"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          <span className="text-[16px] leading-none font-light">+</span>
          Create Document
        </Link>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative min-w-[240px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
              <SearchIcon width={14} height={14} />
            </span>
            <input
              type="text"
              placeholder="Search by title or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as DocStatus | "All")
              }
              className="h-9 appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
              <ChevronIcon />
            </span>
          </div>

          {/* Template filter */}
          <div className="relative">
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
              <ChevronIcon />
            </span>
          </div>

          {/* Initiator filter */}
          <div className="relative">
            <select
              value={initiatorFilter}
              onChange={(e) => setInitiatorFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
            >
              {INITIATOR_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
              <ChevronIcon />
            </span>
          </div>

          {/* Results count */}
          <span className="ml-auto text-[12.5px] text-zinc-400">
            {documents.length} documents
          </span>
        </div>
      </div>

      {/* ── Documents Table ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[30%]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Template
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[110px]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Initiator
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                Created Date
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                Current Approver
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[200px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="group transition-colors hover:bg-zinc-50"
              >
                {/* Title + Number */}
                <td className="px-5 py-3.5">
                  <Link href={`/documents/${doc.id}`} className="block">
                    <p className="text-[13px] font-semibold text-zinc-900 leading-snug group-hover:text-zinc-700 transition-colors">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-mono text-zinc-400">
                      {doc.number}
                    </p>
                  </Link>
                </td>

                {/* Template */}
                <td className="px-4 py-3.5">
                  <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">
                    {doc.template}
                  </p>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge(doc.status)}`}
                  >
                    {doc.status}
                  </span>
                </td>

                {/* Initiator */}
                <td className="px-4 py-3.5">
                  <p className="text-[12.5px] text-zinc-600 whitespace-nowrap">
                    {doc.initiator}
                  </p>
                </td>

                {/* Created Date */}
                <td className="px-4 py-3.5">
                  <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">
                    {doc.createdDate}
                  </p>
                </td>

                {/* Current Approver */}
                <td className="px-4 py-3.5">
                  <p className="text-[12.5px] text-zinc-600 whitespace-nowrap">
                    {doc.currentApprover}
                  </p>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    {/* Edit (only for DRAFT) */}
                    {doc.status === "Draft" && (
                      <Link
                        href={`/documents/${doc.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                      >
                        <EditIcon />
                        Edit
                      </Link>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-300"
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          <p className="text-[12px] text-zinc-400">
            Showing <span className="font-medium text-zinc-600">1–{documents.length}</span> of{" "}
            <span className="font-medium text-zinc-600">{documents.length}</span> documents
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="h-7 rounded-md border border-zinc-200 px-2.5 text-[12px] font-medium text-zinc-400 disabled:opacity-40 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled
              className="h-7 rounded-md border border-zinc-200 px-2.5 text-[12px] font-medium text-zinc-400 disabled:opacity-40 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
