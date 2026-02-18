import Link from "next/link";

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEMPLATES: TemplateItem[] = [
  {
    id: "tpl-001",
    name: "Service Contract",
    category: "Legal",
    description: "Agreements with external service providers, suppliers, and vendors covering scope, SLA, and payment terms.",
    fieldCount: 6,
    approvalSteps: 2,
    createdDate: "12 Jan 2026",
    updatedDate: "15 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-002",
    name: "Non-Disclosure Agreement",
    category: "Legal",
    description: "Confidentiality agreement restricting disclosure of proprietary or sensitive information shared with third parties.",
    fieldCount: 6,
    approvalSteps: 2,
    createdDate: "12 Jan 2026",
    updatedDate: "12 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-003",
    name: "HR Contract",
    category: "HR",
    description: "Employment and service agreements establishing terms and conditions for new or existing personnel.",
    fieldCount: 6,
    approvalSteps: 2,
    createdDate: "14 Jan 2026",
    updatedDate: "20 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-004",
    name: "Budget Memo",
    category: "Finance",
    description: "Formal budget requests and revisions submitted by departments for management and finance sign-off.",
    fieldCount: 5,
    approvalSteps: 3,
    createdDate: "14 Jan 2026",
    updatedDate: "14 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-005",
    name: "Transfer Order",
    category: "Operations",
    description: "Authorises physical and administrative transfer of assets or resources between organisational units.",
    fieldCount: 5,
    approvalSteps: 1,
    createdDate: "16 Jan 2026",
    updatedDate: "16 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-006",
    name: "Vendor Form",
    category: "Operations",
    description: "Vendor qualification and registration form for onboarding new suppliers and service partners.",
    fieldCount: 5,
    approvalSteps: 2,
    createdDate: "18 Jan 2026",
    updatedDate: "22 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-007",
    name: "DPA Template",
    category: "Compliance",
    description: "Data Processing Agreement covering GDPR obligations and responsibilities between data controller and processor.",
    fieldCount: 7,
    approvalSteps: 2,
    createdDate: "20 Jan 2026",
    updatedDate: "20 Jan 2026",
    status: "Active",
  },
  {
    id: "tpl-008",
    name: "Escrow Agreement",
    category: "IT",
    description: "Software escrow agreement ensuring source code access in the event of vendor insolvency or breach.",
    fieldCount: 4,
    approvalSteps: 2,
    createdDate: "25 Jan 2026",
    updatedDate: "25 Jan 2026",
    status: "Draft",
  },
];

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const activeCount = TEMPLATES.filter((t) => t.status === "Active").length;

  return (
    <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Templates
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Manage document templates and approval workflows.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          <span className="text-[16px] leading-none font-light">+</span>
          Create Template
        </button>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Templates",  value: TEMPLATES.length },
          { label: "Active",           value: activeCount },
          { label: "Draft",            value: TEMPLATES.length - activeCount },
          { label: "Categories",       value: new Set(TEMPLATES.map((t) => t.category)).size },
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
                  Template Name
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Fields
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Approval Steps
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                  Created Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[140px]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-zinc-100">
              {TEMPLATES.map((tpl) => (
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
                      {tpl.category}
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
                        Updated {tpl.updatedDate}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge(tpl.status)}`}
                    >
                      {tpl.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                      >
                        <EditIcon />
                        Edit
                      </button>

                      {/* View / Preview */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                      >
                        <EyeIcon />
                        View
                      </button>
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
            <span className="font-medium text-zinc-600">{TEMPLATES.length}</span>{" "}
            templates total —{" "}
            <span className="font-medium text-zinc-600">{activeCount}</span> active
          </p>
        </div>
      </div>
    </div>
  );
}
