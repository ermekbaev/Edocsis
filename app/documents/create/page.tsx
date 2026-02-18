"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "date" | "select" | "textarea";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required: boolean;
  fullWidth?: boolean;
}

interface ApprovalStep {
  step: number;
  actor: string;
  role: string;
}

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  approvalRoute: ApprovalStep[];
  fields: FieldDef[];
}

// ─── Template Definitions ─────────────────────────────────────────────────────

const DEPARTMENTS = [
  "IT Infrastructure",
  "Finance",
  "Human Resources",
  "Legal",
  "Operations",
  "Marketing",
  "Engineering",
  "Business Development",
];

const TEMPLATES: TemplateConfig[] = [
  {
    id: "service-contract",
    name: "Service Contract",
    description:
      "For agreements with external service providers, suppliers, and vendors covering scope, payment terms, and SLA obligations.",
    approvalRoute: [
      { step: 1, actor: "Legal Department",  role: "Legal review & compliance" },
      { step: 2, actor: "Finance Director",   role: "Financial approval"         },
    ],
    fields: [
      { key: "vendor",        label: "Vendor / Supplier",  type: "text",   placeholder: "e.g. Microsoft Corporation",           required: true  },
      { key: "amount",        label: "Contract Amount",    type: "text",   placeholder: "e.g. $84,000",                         required: true  },
      { key: "department",    label: "Department",         type: "select", options: DEPARTMENTS,                                required: true  },
      { key: "effectiveDate", label: "Effective Date",     type: "date",                                                        required: true  },
      { key: "duration",      label: "Contract Duration",  type: "text",   placeholder: "e.g. 12 months",                       required: true  },
      { key: "paymentTerms",  label: "Payment Terms",      type: "select", options: ["Net 15", "Net 30", "Net 45", "Net 60", "Prepaid"], required: false },
    ],
  },
  {
    id: "transfer-order",
    name: "Transfer Order",
    description:
      "Authorises the physical and administrative transfer of assets or resources between organisational units.",
    approvalRoute: [
      { step: 1, actor: "Department Head", role: "Authorisation & sign-off" },
    ],
    fields: [
      { key: "transferFrom",  label: "Transfer From",    type: "select", options: DEPARTMENTS,                          required: true  },
      { key: "transferTo",    label: "Transfer To",      type: "select", options: DEPARTMENTS,                          required: true  },
      { key: "asset",         label: "Asset / Resource", type: "text",   placeholder: "e.g. Dell PowerEdge R740 Server", required: true  },
      { key: "inventoryId",   label: "Inventory ID",     type: "text",   placeholder: "e.g. INV-2021-0044",             required: false },
      { key: "transferDate",  label: "Transfer Date",    type: "date",                                                  required: true  },
    ],
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    description:
      "Confidentiality agreement restricting disclosure of proprietary or sensitive information shared with third parties.",
    approvalRoute: [
      { step: 1, actor: "Legal Department", role: "Legal review"    },
      { step: 2, actor: "Product Manager",  role: "Final approval"  },
    ],
    fields: [
      { key: "counterparty",   label: "Counterparty",                type: "text",     placeholder: "e.g. TechPartners LLC",                required: true,  },
      { key: "representative", label: "Counterparty Representative", type: "text",     placeholder: "e.g. John Davies, CEO",                required: false, },
      { key: "effectiveDate",  label: "Effective Date",              type: "date",                                                          required: true,  },
      { key: "duration",       label: "Agreement Duration",          type: "select",   options: ["1 year", "2 years", "3 years", "5 years", "Indefinite"], required: true },
      { key: "governingLaw",   label: "Governing Law",               type: "text",     placeholder: "e.g. Republic of Kazakhstan",          required: false  },
      { key: "purpose",        label: "Purpose",                     type: "textarea", placeholder: "Describe the purpose of this agreement…", required: true, fullWidth: true },
    ],
  },
  {
    id: "budget-memo",
    name: "Budget Memo",
    description:
      "Formal budget request or revision submitted by a department for management and finance review.",
    approvalRoute: [
      { step: 1, actor: "Department Director", role: "Department sign-off"  },
      { step: 2, actor: "Finance Director",    role: "Financial review"     },
      { step: 3, actor: "CFO",                 role: "Final approval"       },
    ],
    fields: [
      { key: "department",    label: "Department",       type: "select", options: DEPARTMENTS,         required: true  },
      { key: "period",        label: "Budget Period",    type: "text",   placeholder: "e.g. Q1 2026",   required: true  },
      { key: "currentBudget", label: "Current Budget",   type: "text",   placeholder: "e.g. $320,000", required: true  },
      { key: "requested",     label: "Requested Amount", type: "text",   placeholder: "e.g. $410,000", required: true  },
      { key: "costCenter",    label: "Cost Center",      type: "text",   placeholder: "e.g. CC-ENG-001", required: false },
    ],
  },
  {
    id: "hr-contract",
    name: "HR Contract",
    description:
      "Employment or service agreement establishing terms and conditions for new or existing personnel.",
    approvalRoute: [
      { step: 1, actor: "HR Manager",          role: "HR review & verification" },
      { step: 2, actor: "Department Director", role: "Final approval"            },
    ],
    fields: [
      { key: "employeeName",  label: "Employee Full Name",   type: "text",   placeholder: "First Last",                                              required: true },
      { key: "position",      label: "Position / Title",     type: "text",   placeholder: "e.g. Senior Software Engineer",                           required: true },
      { key: "department",    label: "Department",           type: "select", options: DEPARTMENTS,                                                   required: true },
      { key: "startDate",     label: "Start Date",           type: "date",                                                                           required: true },
      { key: "contractType",  label: "Contract Type",        type: "select", options: ["Full-time", "Part-time", "Fixed-term", "Freelance"],          required: true },
      { key: "salary",        label: "Gross Salary / Month", type: "text",   placeholder: "e.g. $5,000",                                            required: true },
    ],
  },
  {
    id: "vendor-form",
    name: "Vendor Form",
    description:
      "Vendor qualification and registration form for onboarding new suppliers and service partners.",
    approvalRoute: [
      { step: 1, actor: "Procurement",      role: "Qualification review" },
      { step: 2, actor: "Legal Department", role: "Compliance check"     },
    ],
    fields: [
      { key: "vendorName",  label: "Vendor Name",              type: "text",   placeholder: "Company legal name",     required: true  },
      { key: "vendorType",  label: "Vendor Type",              type: "select", options: ["Goods Supplier", "Service Provider", "IT Vendor", "Consultant", "Logistics"], required: true },
      { key: "country",     label: "Country of Registration",  type: "text",   placeholder: "e.g. Republic of Kazakhstan",  required: true  },
      { key: "taxId",       label: "Tax ID / BIN",             type: "text",   placeholder: "e.g. 123456789012",     required: false },
      { key: "department",  label: "Requesting Department",    type: "select", options: DEPARTMENTS,                 required: true  },
    ],
  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Shared input classes
const inputCls =
  "h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors";

const selectCls =
  "h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateDocumentPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");

  const template = TEMPLATES.find((t) => t.id === selectedTemplateId) ?? null;

  function handleTemplateChange(id: string) {
    setSelectedTemplateId(id);
    setFormValues({});
    setTitle("");
  }

  function handleFieldChange(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <BackIcon />
        Back to Documents
      </Link>

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Create Document
        </h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Select a template, fill in the required fields, then save or submit for approval.
        </p>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Left column: template + dynamic fields ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Template selector */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Select Template
              </h3>
              <p className="mt-0.5 text-[12.5px] text-zinc-400">
                Choose a document type to load the appropriate form fields.
              </p>
            </div>

            <div className="px-5 py-5 space-y-3">
              {/* Dropdown */}
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3.5 pr-9 text-[13px] text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">— Select a template —</option>
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                  <ChevronIcon />
                </span>
              </div>

              {/* Template description */}
              {template ? (
                <div className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" aria-hidden="true" />
                  <p className="text-[12.5px] leading-relaxed text-zinc-500">
                    {template.description}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 py-8">
                  <p className="text-[13px] text-zinc-400">
                    No template selected. Select one above to continue.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic fields — rendered only after a template is selected */}
          {template && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">
                      Document Fields
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-zinc-400">
                      Fields specific to{" "}
                      <span className="font-medium text-zinc-600">
                        {template.name}
                      </span>
                      . Required fields marked{" "}
                      <span className="text-rose-500">*</span>
                    </p>
                  </div>
                  {/* Required vs optional count */}
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-zinc-400">
                      {template.fields.filter((f) => f.required).length} required
                      {" / "}
                      {template.fields.filter((f) => !f.required).length} optional
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  {template.fields.map((field) => (
                    <div
                      key={field.key}
                      className={field.fullWidth ? "sm:col-span-2" : ""}
                    >
                      <label className="mb-1.5 block text-[12px] font-medium text-zinc-600">
                        {field.label}
                        {field.required && (
                          <span className="ml-0.5 text-rose-500">*</span>
                        )}
                        {!field.required && (
                          <span className="ml-1.5 text-[10.5px] font-normal text-zinc-400">
                            optional
                          </span>
                        )}
                      </label>

                      {/* Select */}
                      {field.type === "select" && (
                        <div className="relative">
                          <select
                            value={formValues[field.key] ?? ""}
                            onChange={(e) =>
                              handleFieldChange(field.key, e.target.value)
                            }
                            className={selectCls}
                          >
                            <option value="">Select…</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                            <ChevronIcon />
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      {field.type === "date" && (
                        <input
                          type="date"
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          className={inputCls}
                        />
                      )}

                      {/* Textarea */}
                      {field.type === "textarea" && (
                        <textarea
                          rows={3}
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
                        />
                      )}

                      {/* Text */}
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: details + approval route + actions ── */}
        <div className="space-y-6">

          {/* Document Details */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Document Details
              </h3>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Title input */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-zinc-600">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    template
                      ? `e.g. ${template.name} — ${new Date().getFullYear()}`
                      : "Enter document title…"
                  }
                  className={inputCls}
                />
              </div>

              {/* Metadata */}
              <div className="space-y-3 border-t border-zinc-100 pt-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Initiator
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-[9px] font-semibold text-white">
                      AK
                    </div>
                    <p className="text-[13px] font-medium text-zinc-800">
                      Adil Kaliyev
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Date
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-zinc-800">
                    {today}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Template
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-zinc-700">
                    {template?.name ?? (
                      <span className="text-zinc-400">Not selected</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Status
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                    Draft
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Route — only when template selected */}
          {template && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  Approval Route
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  Steps after submission
                </p>
              </div>

              <div className="px-5 py-4">
                <ol className="space-y-0">
                  {template.approvalRoute.map((step, idx) => {
                    const isLast = idx === template.approvalRoute.length - 1;
                    return (
                      <li key={step.step} className="relative flex gap-3">
                        {/* Connector line */}
                        {!isLast && (
                          <span
                            className="absolute left-[9px] top-5 h-full w-px bg-zinc-100"
                            aria-hidden="true"
                          />
                        )}
                        {/* Step number */}
                        <span className="relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
                          {step.step}
                        </span>
                        {/* Content */}
                        <div className={`${isLast ? "" : "pb-4"}`}>
                          <p className="text-[13px] font-medium text-zinc-800">
                            {step.actor}
                          </p>
                          <p className="text-[11.5px] text-zinc-400">
                            {step.role}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 space-y-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-lg bg-zinc-900 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!template || !title.trim()}
            >
              Submit for Approval
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white py-2.5 text-[13px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!template}
            >
              Save as Draft
            </button>
            <p className="text-center text-[11px] text-zinc-400">
              Drafts can be edited and submitted later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
