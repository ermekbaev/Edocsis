import Link from "next/link";
import { notFound } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "Text" | "Date" | "Select" | "Number" | "Textarea";
type TemplateStatus = "Active" | "Draft";
type TemplateCategory = "Legal" | "HR" | "Finance" | "Operations" | "IT" | "Compliance";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  options?: string[];
}

interface ApprovalStep {
  step: number;
  actor: string;
  role: string;
}

interface TemplateDetail {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  status: TemplateStatus;
  usedInDocuments: number;
  fields: FieldDef[];
  approvalRoute: ApprovalStep[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, TemplateDetail> = {
  "tpl-001": {
    id: "tpl-001",
    name: "Service Contract",
    category: "Legal",
    description: "Agreements with external service providers, suppliers, and vendors covering scope of work, SLA obligations, payment terms, and termination conditions.",
    createdDate: "12 Jan 2026",
    updatedDate: "15 Jan 2026",
    createdBy: "Adil Kaliyev",
    status: "Active",
    usedInDocuments: 14,
    fields: [
      { key: "vendor",        label: "Vendor / Supplier",  type: "Text",   placeholder: "e.g. Microsoft Corporation",  required: true  },
      { key: "amount",        label: "Contract Amount",    type: "Text",   placeholder: "e.g. $84,000",                required: true  },
      { key: "department",    label: "Department",         type: "Select", placeholder: "Select department",           required: true, options: ["IT", "Finance", "HR", "Legal", "Operations"] },
      { key: "effectiveDate", label: "Effective Date",     type: "Date",   placeholder: "",                            required: true  },
      { key: "duration",      label: "Contract Duration",  type: "Text",   placeholder: "e.g. 12 months",              required: true  },
      { key: "paymentTerms",  label: "Payment Terms",      type: "Select", placeholder: "Select payment terms",        required: false, options: ["Net 15", "Net 30", "Net 45", "Net 60", "Prepaid"] },
    ],
    approvalRoute: [
      { step: 1, actor: "Legal Department",  role: "Legal review & compliance check"   },
      { step: 2, actor: "Finance Director",  role: "Financial approval & budget sign-off" },
    ],
  },

  "tpl-002": {
    id: "tpl-002",
    name: "Non-Disclosure Agreement",
    category: "Legal",
    description: "Confidentiality agreement restricting disclosure of proprietary or sensitive information shared with third parties during business evaluations or partnerships.",
    createdDate: "12 Jan 2026",
    updatedDate: "12 Jan 2026",
    createdBy: "Adil Kaliyev",
    status: "Active",
    usedInDocuments: 8,
    fields: [
      { key: "counterparty",   label: "Counterparty",                type: "Text",     placeholder: "e.g. TechPartners LLC",        required: true  },
      { key: "representative", label: "Counterparty Representative", type: "Text",     placeholder: "e.g. John Davies, CEO",        required: false },
      { key: "effectiveDate",  label: "Effective Date",              type: "Date",     placeholder: "",                             required: true  },
      { key: "duration",       label: "Agreement Duration",          type: "Select",   placeholder: "Select duration",              required: true, options: ["1 year", "2 years", "3 years", "5 years", "Indefinite"] },
      { key: "governingLaw",   label: "Governing Law",               type: "Text",     placeholder: "e.g. Republic of Kazakhstan",  required: false },
      { key: "purpose",        label: "Purpose",                     type: "Textarea", placeholder: "Describe the purpose…",        required: true  },
    ],
    approvalRoute: [
      { step: 1, actor: "Legal Department", role: "Legal review & NDA terms validation" },
      { step: 2, actor: "Product Manager",  role: "Business approval & final sign-off"  },
    ],
  },

  "tpl-003": {
    id: "tpl-003",
    name: "HR Contract",
    category: "HR",
    description: "Employment and service agreements establishing terms, compensation, and conditions for new or existing personnel across all departments.",
    createdDate: "14 Jan 2026",
    updatedDate: "20 Jan 2026",
    createdBy: "HR Department",
    status: "Active",
    usedInDocuments: 22,
    fields: [
      { key: "employeeName",  label: "Employee Full Name",   type: "Text",   placeholder: "First Last",                        required: true  },
      { key: "position",      label: "Position / Title",     type: "Text",   placeholder: "e.g. Senior Software Engineer",     required: true  },
      { key: "department",    label: "Department",           type: "Select", placeholder: "Select department",                 required: true, options: ["IT", "Finance", "HR", "Legal", "Operations", "Engineering"] },
      { key: "startDate",     label: "Start Date",           type: "Date",   placeholder: "",                                  required: true  },
      { key: "contractType",  label: "Contract Type",        type: "Select", placeholder: "Select contract type",              required: true, options: ["Full-time", "Part-time", "Fixed-term", "Freelance"] },
      { key: "salary",        label: "Gross Salary / Month", type: "Number", placeholder: "e.g. 5000",                        required: true  },
    ],
    approvalRoute: [
      { step: 1, actor: "HR Manager",          role: "HR review & verification"       },
      { step: 2, actor: "Department Director",  role: "Department approval"            },
    ],
  },

  "tpl-004": {
    id: "tpl-004",
    name: "Budget Memo",
    category: "Finance",
    description: "Formal budget requests and revisions submitted by departments for management review and finance approval, with cost center tracking.",
    createdDate: "14 Jan 2026",
    updatedDate: "14 Jan 2026",
    createdBy: "Finance Department",
    status: "Active",
    usedInDocuments: 6,
    fields: [
      { key: "department",    label: "Department",       type: "Select", placeholder: "Select department",   required: true,  options: ["IT", "Finance", "HR", "Legal", "Operations", "Engineering"] },
      { key: "period",        label: "Budget Period",    type: "Text",   placeholder: "e.g. Q1 2026",         required: true  },
      { key: "currentBudget", label: "Current Budget",   type: "Number", placeholder: "e.g. 320000",         required: true  },
      { key: "requested",     label: "Requested Amount", type: "Number", placeholder: "e.g. 410000",         required: true  },
      { key: "costCenter",    label: "Cost Center",      type: "Text",   placeholder: "e.g. CC-ENG-001",     required: false },
    ],
    approvalRoute: [
      { step: 1, actor: "Department Director", role: "Department sign-off"         },
      { step: 2, actor: "Finance Director",    role: "Financial review"            },
      { step: 3, actor: "CFO",                 role: "Final approval"              },
    ],
  },

  "tpl-005": {
    id: "tpl-005",
    name: "Transfer Order",
    category: "Operations",
    description: "Authorises the physical and administrative transfer of assets or resources between organisational units with full traceability.",
    createdDate: "16 Jan 2026",
    updatedDate: "16 Jan 2026",
    createdBy: "Operations",
    status: "Active",
    usedInDocuments: 11,
    fields: [
      { key: "transferFrom", label: "Transfer From",    type: "Select", placeholder: "Select department",                    required: true,  options: ["IT", "Finance", "HR", "Legal", "Operations", "Engineering"] },
      { key: "transferTo",   label: "Transfer To",      type: "Select", placeholder: "Select department",                    required: true,  options: ["IT", "Finance", "HR", "Legal", "Operations", "Engineering"] },
      { key: "asset",        label: "Asset / Resource", type: "Text",   placeholder: "e.g. Dell PowerEdge R740 Server",       required: true  },
      { key: "inventoryId",  label: "Inventory ID",     type: "Text",   placeholder: "e.g. INV-2021-0044",                    required: false },
      { key: "transferDate", label: "Transfer Date",    type: "Date",   placeholder: "",                                      required: true  },
    ],
    approvalRoute: [
      { step: 1, actor: "Department Head", role: "Authorisation & sign-off" },
    ],
  },

  "tpl-006": {
    id: "tpl-006",
    name: "Vendor Form",
    category: "Operations",
    description: "Vendor qualification and registration form for onboarding new suppliers and service partners, covering legal and compliance requirements.",
    createdDate: "18 Jan 2026",
    updatedDate: "22 Jan 2026",
    createdBy: "Procurement",
    status: "Active",
    usedInDocuments: 9,
    fields: [
      { key: "vendorName",  label: "Vendor Name",              type: "Text",   placeholder: "Company legal name",                           required: true  },
      { key: "vendorType",  label: "Vendor Type",              type: "Select", placeholder: "Select vendor type",                           required: true, options: ["Goods Supplier", "Service Provider", "IT Vendor", "Consultant"] },
      { key: "country",     label: "Country of Registration",  type: "Text",   placeholder: "e.g. Republic of Kazakhstan",                  required: true  },
      { key: "taxId",       label: "Tax ID / BIN",             type: "Text",   placeholder: "e.g. 123456789012",                            required: false },
      { key: "department",  label: "Requesting Department",    type: "Select", placeholder: "Select department",                            required: true, options: ["IT", "Finance", "HR", "Legal", "Operations"] },
    ],
    approvalRoute: [
      { step: 1, actor: "Procurement",      role: "Vendor qualification review" },
      { step: 2, actor: "Legal Department", role: "Compliance & legal check"    },
    ],
  },

  "tpl-007": {
    id: "tpl-007",
    name: "DPA Template",
    category: "Compliance",
    description: "Data Processing Agreement covering GDPR obligations, data controller and processor responsibilities, and data retention policies.",
    createdDate: "20 Jan 2026",
    updatedDate: "20 Jan 2026",
    createdBy: "Legal Department",
    status: "Active",
    usedInDocuments: 4,
    fields: [
      { key: "processor",      label: "Data Processor",       type: "Text",   placeholder: "Company name",                  required: true  },
      { key: "controller",     label: "Data Controller",      type: "Text",   placeholder: "Company name",                  required: true  },
      { key: "dataTypes",      label: "Types of Data",        type: "Textarea", placeholder: "Describe data categories…",   required: true  },
      { key: "purpose",        label: "Processing Purpose",   type: "Textarea", placeholder: "Describe the purpose…",       required: true  },
      { key: "effectiveDate",  label: "Effective Date",       type: "Date",   placeholder: "",                              required: true  },
      { key: "retention",      label: "Retention Period",     type: "Text",   placeholder: "e.g. 3 years",                  required: true  },
      { key: "jurisdiction",   label: "Governing Jurisdiction", type: "Text", placeholder: "e.g. EU / Republic of Kazakhstan", required: false },
    ],
    approvalRoute: [
      { step: 1, actor: "Data Protection Officer", role: "DPO review & GDPR check"   },
      { step: 2, actor: "Legal Department",         role: "Final legal approval"      },
    ],
  },

  "tpl-008": {
    id: "tpl-008",
    name: "Escrow Agreement",
    category: "IT",
    description: "Software escrow agreement ensuring source code access and continuity in the event of vendor insolvency, material breach, or business discontinuation.",
    createdDate: "25 Jan 2026",
    updatedDate: "25 Jan 2026",
    createdBy: "Adil Kaliyev",
    status: "Draft",
    usedInDocuments: 0,
    fields: [
      { key: "softwareVendor", label: "Software Vendor",     type: "Text", placeholder: "e.g. Accenture Ltd.",     required: true  },
      { key: "software",       label: "Software Name",       type: "Text", placeholder: "e.g. ERP Core System",   required: true  },
      { key: "escrowAgent",    label: "Escrow Agent",        type: "Text", placeholder: "e.g. NCC Group",          required: true  },
      { key: "releaseCondition", label: "Release Condition", type: "Textarea", placeholder: "Define release triggers…", required: true },
    ],
    approvalRoute: [
      { step: 1, actor: "IT Director",      role: "Technical review"        },
      { step: 2, actor: "Legal Department", role: "Legal review & sign-off" },
    ],
  },
};

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

function fieldTypeBadge(type: FieldType): string {
  const map: Record<FieldType, string> = {
    Text:     "bg-zinc-100 text-zinc-600",
    Date:     "bg-sky-50 text-sky-700",
    Select:   "bg-violet-50 text-violet-700",
    Number:   "bg-amber-50 text-amber-700",
    Textarea: "bg-emerald-50 text-emerald-700",
  };
  return map[type];
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tpl = TEMPLATES[id];

  if (!tpl) notFound();

  return (
    <div className="space-y-6">

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <BackIcon />
        Back to Templates
      </Link>

      {/* ── Template Header ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: name + badges + description */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryBadge(tpl.category)}`}>
                {tpl.category}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                tpl.status === "Active"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200"
              }`}>
                {tpl.status}
              </span>
            </div>
            <h1 className="mt-2 text-[20px] font-semibold tracking-tight text-zinc-900">
              {tpl.name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-zinc-500">
              {tpl.description}
            </p>
          </div>

          {/* Right: Edit button */}
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
          >
            <EditIcon />
            Edit Template
          </button>
        </div>

        {/* Metadata strip */}
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-zinc-100 pt-5 sm:grid-cols-4">
          {[
            { label: "Created By",      value: tpl.createdBy        },
            { label: "Created Date",    value: tpl.createdDate      },
            { label: "Last Updated",    value: tpl.updatedDate      },
            { label: "Used In",         value: `${tpl.usedInDocuments} document${tpl.usedInDocuments !== 1 ? "s" : ""}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                {label}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-zinc-700">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Document Fields — 2/3 ── */}
        <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Document Fields
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-400">
                {tpl.fields.length} fields —{" "}
                {tpl.fields.filter((f) => f.required).length} required,{" "}
                {tpl.fields.filter((f) => !f.required).length} optional
              </p>
            </div>
          </div>

          {/* Fields table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Field Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Field Type
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Placeholder
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Required
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tpl.fields.map((field) => (
                <tr key={field.key} className="hover:bg-zinc-50 transition-colors">
                  {/* Field Name */}
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold text-zinc-900">
                      {field.label}
                    </p>
                    {field.options && (
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {field.options.length} options
                      </p>
                    )}
                  </td>

                  {/* Field Type */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${fieldTypeBadge(field.type)}`}>
                      {field.type}
                    </span>
                  </td>

                  {/* Placeholder */}
                  <td className="px-4 py-3.5">
                    <p className="text-[12px] text-zinc-400 italic">
                      {field.placeholder || "—"}
                    </p>
                  </td>

                  {/* Required */}
                  <td className="px-4 py-3.5">
                    {field.required ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
                        Optional
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Right column — 1/3 ── */}
        <div className="space-y-6">

          {/* Template stats */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Template Info
              </h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {[
                { label: "Total Fields",     value: tpl.fields.length          },
                { label: "Required Fields",  value: tpl.fields.filter((f) => f.required).length  },
                { label: "Optional Fields",  value: tpl.fields.filter((f) => !f.required).length },
                { label: "Approval Steps",   value: tpl.approvalRoute.length   },
                { label: "Used In",          value: `${tpl.usedInDocuments} docs`                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <p className="text-[12.5px] text-zinc-500">{label}</p>
                  <p className="text-[13px] font-semibold text-zinc-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval workflow */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Approval Workflow
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-400">
                {tpl.approvalRoute.length}-step sequential process
              </p>
            </div>

            <div className="px-5 py-5">
              <ol className="space-y-0">
                {tpl.approvalRoute.map((step, idx) => {
                  const isLast = idx === tpl.approvalRoute.length - 1;
                  return (
                    <li key={step.step} className="relative flex gap-4">
                      {/* Connector */}
                      {!isLast && (
                        <span
                          className="absolute left-[13px] top-6 h-full w-px bg-zinc-100"
                          aria-hidden="true"
                        />
                      )}

                      {/* Step circle */}
                      <div className="relative z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-[11px] font-bold text-zinc-600">
                        {step.step}
                      </div>

                      {/* Content */}
                      <div className={`min-w-0 ${isLast ? "" : "pb-5"}`}>
                        <p className="text-[13px] font-semibold text-zinc-900 leading-snug">
                          {step.actor}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-zinc-400">
                          {step.role}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Sequential note */}
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3.5 py-3">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" aria-hidden="true" />
                <p className="text-[12px] leading-relaxed text-zinc-500">
                  Steps are executed sequentially. Each approver is notified only after the previous step is completed.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
