"use client";

import { use, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "Draft" | "In Approval" | "Approved" | "Rejected";
type TimelineEventType = "created" | "submitted" | "approved" | "rejected" | "pending";

interface DocField {
  label: string;
  value: string;
}

interface TimelineEvent {
  type: TimelineEventType;
  label: string;
  actor: string;
  date: string;
  comment?: string;
}

interface DocumentDetail {
  id: string;
  title: string;
  template: string;
  status: DocStatus;
  initiator: string;
  createdDate: string;
  currentApprover: string;
  fields: DocField[];
  contentTitle: string;
  contentBody: string;
  timeline: TimelineEvent[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CURRENT_USER = "Adil Kaliyev";

const DOCUMENTS: Record<string, DocumentDetail> = {
  "DOC-2024-0891": {
    id: "DOC-2024-0891",
    title: "Procurement Contract — Azure Cloud Services",
    template: "Service Contract",
    status: "In Approval",
    initiator: "Adil Kaliyev",
    createdDate: "17 Feb 2026",
    currentApprover: "Elena Volkova",
    fields: [
      { label: "Vendor",            value: "Microsoft Corporation" },
      { label: "Service",           value: "Azure Cloud Platform" },
      { label: "Contract Amount",   value: "$84,000 / year" },
      { label: "Department",        value: "IT Infrastructure" },
      { label: "Effective Date",    value: "01 Mar 2026" },
      { label: "Contract Duration", value: "12 months" },
      { label: "Payment Terms",     value: "Net 30" },
      { label: "Account Manager",   value: "James Wilson" },
    ],
    contentTitle: "Cloud Services Procurement Agreement",
    contentBody: `This Service Agreement ("Agreement") is entered into as of March 1, 2026, by and between Edocsis LLC ("Customer") and Microsoft Corporation ("Provider").

1. SCOPE OF SERVICES
Provider agrees to deliver Azure Cloud Platform services as described in Exhibit A, including compute, storage, and networking resources as required by Customer's IT Infrastructure department. Services shall be rendered in accordance with the Service Level Agreement (SLA) attached hereto as Exhibit B.

2. PAYMENT TERMS
Customer agrees to pay Provider the annual sum of eighty-four thousand dollars ($84,000), invoiced monthly at $7,000, due within thirty (30) days of invoice date. Late payments shall accrue interest at 1.5% per month.

3. CONFIDENTIALITY
Each party agrees to maintain in strict confidence all Confidential Information disclosed by the other party and to use it solely for the purposes of this Agreement.

4. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months unless earlier terminated. Either party may terminate this Agreement with sixty (60) days' prior written notice.`,
    timeline: [
      { type: "created",   label: "Document created",        actor: "Adil Kaliyev",  date: "17 Feb 2026, 09:15" },
      { type: "submitted", label: "Submitted for approval",  actor: "Adil Kaliyev",  date: "17 Feb 2026, 09:41" },
      { type: "pending",   label: "Pending review",          actor: "Elena Volkova", date: "17 Feb 2026, 09:41" },
    ],
  },

  "DOC-2024-0890": {
    id: "DOC-2024-0890",
    title: "Internal Transfer Order #IT-4412",
    template: "Transfer Order",
    status: "Approved",
    initiator: "Sergey Lebedev",
    createdDate: "16 Feb 2026",
    currentApprover: "—",
    fields: [
      { label: "Transfer From",  value: "Finance Department" },
      { label: "Transfer To",    value: "IT Infrastructure" },
      { label: "Asset",          value: "Dell PowerEdge R740 Server" },
      { label: "Inventory ID",   value: "INV-2021-0044" },
      { label: "Transfer Date",  value: "18 Feb 2026" },
      { label: "Authorised By",  value: "Elena Volkova" },
    ],
    contentTitle: "Internal Asset Transfer Order",
    contentBody: `This Transfer Order authorises the physical and administrative transfer of the below-listed asset between organisational units.

ASSET DESCRIPTION
Dell PowerEdge R740 Rack Server, Serial No. DPR740-2021-8812, currently assigned to Finance Department (Room 304, Block A). The asset is to be reassigned to IT Infrastructure (Server Room 1, Block C) effective 18 February 2026.

REASON FOR TRANSFER
Finance Department has completed the migration to cloud-hosted infrastructure and no longer requires dedicated on-premise compute hardware. IT Infrastructure requires additional server capacity for the new development environment.

CONDITION NOTES
Asset is in full working order. Wiping and re-provisioning to be performed by IT Infrastructure prior to deployment.`,
    timeline: [
      { type: "created",   label: "Document created",       actor: "Sergey Lebedev", date: "16 Feb 2026, 11:00" },
      { type: "submitted", label: "Submitted for approval", actor: "Sergey Lebedev", date: "16 Feb 2026, 11:15" },
      { type: "approved",  label: "Approved",               actor: "Elena Volkova",  date: "16 Feb 2026, 14:30",
        comment: "Approved. IT can proceed with the transfer after scheduling maintenance window." },
    ],
  },

  "DOC-2024-0889": {
    id: "DOC-2024-0889",
    title: "NDA with TechPartners LLC",
    template: "Non-Disclosure Agreement",
    status: "In Approval",
    initiator: "Maria Kuznetsova",
    createdDate: "16 Feb 2026",
    currentApprover: "Adil Kaliyev",
    fields: [
      { label: "Counterparty",                value: "TechPartners LLC" },
      { label: "Counterparty Representative", value: "John Davies, CEO" },
      { label: "Effective Date",              value: "01 Mar 2026" },
      { label: "Duration",                    value: "2 years" },
      { label: "Governing Law",               value: "Republic of Kazakhstan" },
      { label: "Department",                  value: "Business Development" },
      { label: "Purpose",                     value: "Partnership evaluation and due diligence" },
    ],
    contentTitle: "Non-Disclosure Agreement",
    contentBody: `This Non-Disclosure Agreement ("Agreement") is entered into as of March 1, 2026, between Edocsis LLC, a limited liability company incorporated under the laws of the Republic of Kazakhstan ("Disclosing Party"), and TechPartners LLC ("Receiving Party").

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information that relates to the actual or anticipated business, research or development of either party, including without limitation technical data, trade secrets, know-how, business plans, customer lists, and financial information disclosed by one party to the other.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees: (a) to hold the Confidential Information in strict confidence; (b) not to disclose the Confidential Information to any third parties; (c) not to use any Confidential Information for any purpose except to evaluate and engage in discussions concerning a potential business relationship.

3. TERM
This Agreement shall remain in effect for two (2) years from the Effective Date, unless terminated earlier by mutual written agreement of the parties.

4. RETURN OF INFORMATION
Upon request, the Receiving Party shall promptly return or destroy all materials containing Confidential Information and certify in writing that such destruction or return has been completed.`,
    timeline: [
      { type: "created",   label: "Document created",        actor: "Maria Kuznetsova",  date: "16 Feb 2026, 09:10" },
      { type: "submitted", label: "Submitted for approval",  actor: "Maria Kuznetsova",  date: "16 Feb 2026, 09:41" },
      { type: "approved",  label: "Approved",                actor: "Legal Department",  date: "16 Feb 2026, 13:20",
        comment: "Legal review completed. NDA terms are standard and acceptable." },
      { type: "pending",   label: "Pending final approval",  actor: "Adil Kaliyev",      date: "16 Feb 2026, 13:20" },
    ],
  },

  "DOC-2024-0888": {
    id: "DOC-2024-0888",
    title: "Q4 Budget Revision — Engineering Dept.",
    template: "Budget Memo",
    status: "Rejected",
    initiator: "Dmitry Ryabov",
    createdDate: "15 Feb 2026",
    currentApprover: "—",
    fields: [
      { label: "Department",          value: "Engineering" },
      { label: "Budget Period",       value: "Q4 2025" },
      { label: "Original Budget",     value: "$320,000" },
      { label: "Requested Revision",  value: "$410,000" },
      { label: "Delta",               value: "+$90,000 (+28%)" },
      { label: "Cost Center",         value: "CC-ENG-001" },
    ],
    contentTitle: "Budget Revision Request — Q4 2025",
    contentBody: `This memorandum requests a revision to the Engineering Department's Q4 2025 budget allocation.

REASON FOR REVISION
The original budget of $320,000 was approved in September 2025 based on project forecasts that did not account for the following material changes:

1. Acquisition of three (3) additional senior engineers in October 2025, increasing personnel costs by $45,000.
2. Unplanned infrastructure upgrade required for compliance with new data residency regulations, estimated at $28,000.
3. Extended scope of Project Phoenix requiring additional tooling licenses ($17,000).

REQUESTED AMOUNT
We request an additional allocation of $90,000, bringing the revised total to $410,000 for Q4 2025.

JUSTIFICATION
All three factors are non-discretionary and directly tied to business continuity. Detailed cost breakdowns are available in Appendix A.`,
    timeline: [
      { type: "created",   label: "Document created",       actor: "Dmitry Ryabov",  date: "15 Feb 2026, 10:00" },
      { type: "submitted", label: "Submitted for approval", actor: "Dmitry Ryabov",  date: "15 Feb 2026, 10:30" },
      { type: "approved",  label: "Approved",               actor: "Elena Volkova",  date: "15 Feb 2026, 15:00",
        comment: "Approved at department level. Forwarded to Finance for final sign-off." },
      { type: "rejected",  label: "Rejected",               actor: "Boris Nikitin",  date: "15 Feb 2026, 17:45",
        comment: "Budget revision exceeds quarterly threshold by 28%. Per policy §4.2, revisions above 20% require CFO approval. Please resubmit with CFO endorsement." },
    ],
  },
};

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

function TimelineDot({ type }: { type: TimelineEventType }) {
  if (type === "approved") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-white">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (type === "rejected") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 ring-2 ring-white">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" stroke="#e11d48" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (type === "pending") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 ring-2 ring-white">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
      </span>
    );
  }
  // created / submitted
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-2 ring-white">
      <span className="h-2 w-2 rounded-full bg-zinc-400" />
    </span>
  );
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
  const doc = DOCUMENTS[id];

  const [comment, setComment] = useState("");

  if (!doc) {
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

  const isCurrentApprover = doc.currentApprover === CURRENT_USER;

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
              <span className="font-mono text-[12px] text-zinc-400">{doc.id}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(doc.status)}`}
              >
                {doc.status}
              </span>
            </div>
            <h1 className="mt-2 text-[20px] font-semibold tracking-tight text-zinc-900 leading-snug">
              {doc.title}
            </h1>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-zinc-100 pt-5 sm:grid-cols-4">
          {[
            { label: "Template",  value: doc.template },
            { label: "Initiator", value: doc.initiator },
            { label: "Created",   value: doc.createdDate },
            {
              label: "Current Approver",
              value: doc.currentApprover,
              highlight: doc.status === "In Approval",
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
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Document Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-px bg-zinc-100 sm:grid-cols-2">
              {doc.fields.map((field) => (
                <div key={field.label} className="bg-white px-6 py-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    {field.label}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-zinc-800">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Document Content */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                {doc.contentTitle}
              </h3>
            </div>
            <div className="px-6 py-5">
              {doc.contentBody.split("\n\n").map((paragraph, idx) => (
                <p
                  key={idx}
                  className="mb-4 text-[13.5px] leading-relaxed text-zinc-600 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
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
                  {doc.status === "In Approval" && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-[12px] font-medium text-zinc-500">
                        Awaiting approval from
                      </p>
                      <p className="mt-0.5 text-[13.5px] font-semibold text-zinc-900">
                        {doc.currentApprover}
                      </p>
                    </div>
                  )}
                  {doc.status === "Approved" && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-emerald-800">
                        Document approved
                      </p>
                      <p className="mt-0.5 text-[12px] text-emerald-700">
                        This document has completed the approval process.
                      </p>
                    </div>
                  )}
                  {doc.status === "Rejected" && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-[12.5px] font-semibold text-rose-800">
                        Document rejected
                      </p>
                      <p className="mt-0.5 text-[12px] text-rose-700">
                        This document was rejected. See the timeline for the reason.
                      </p>
                    </div>
                  )}
                  {doc.status === "Draft" && (
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

          {/* Approval Timeline */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Approval Timeline
              </h3>
            </div>

            <div className="px-5 py-4">
              <ol className="relative space-y-0">
                {doc.timeline.map((event, idx) => {
                  const isLast = idx === doc.timeline.length - 1;
                  return (
                    <li key={idx} className="relative flex gap-4">
                      {/* Vertical connector line */}
                      {!isLast && (
                        <span
                          className="absolute left-[11px] top-6 h-full w-px bg-zinc-100"
                          aria-hidden="true"
                        />
                      )}

                      {/* Dot */}
                      <div className="relative z-10 mt-0.5 shrink-0">
                        <TimelineDot type={event.type} />
                      </div>

                      {/* Content */}
                      <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                        <p className="text-[13px] font-semibold text-zinc-900">
                          {event.label}
                        </p>
                        <p className="mt-0.5 text-[12px] text-zinc-500">
                          {event.actor}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-zinc-400">
                          {event.date}
                        </p>
                        {event.comment && (
                          <div className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                            <p className="text-[12px] leading-relaxed text-zinc-600 italic">
                              &ldquo;{event.comment}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
