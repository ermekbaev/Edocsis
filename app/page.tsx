// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Documents", value: "318", change: "+14", trend: "up" as const },
  { label: "In Approval",     value: "47",  change: "+6",  trend: "up" as const },
  { label: "Approved",        value: "241", change: "+9",  trend: "up" as const },
  { label: "Rejected",        value: "30",  change: "+2",  trend: "down" as const },
];

type DocStatus = "In Approval" | "Approved" | "Rejected" | "Draft";

const RECENT_DOCUMENTS: {
  id: string;
  title: string;
  template: string;
  status: DocStatus;
  initiator: string;
  currentApprover: string;
}[] = [
  {
    id: "DOC-2024-0891",
    title: "Procurement Contract — Azure Cloud Services",
    template: "Service Contract",
    status: "In Approval",
    initiator: "Adil K.",
    currentApprover: "Elena V.",
  },
  {
    id: "DOC-2024-0890",
    title: "Internal Transfer Order #IT-4412",
    template: "Transfer Order",
    status: "Approved",
    initiator: "Sergey L.",
    currentApprover: "—",
  },
  {
    id: "DOC-2024-0889",
    title: "NDA with TechPartners LLC",
    template: "Non-Disclosure Agreement",
    status: "In Approval",
    initiator: "Maria K.",
    currentApprover: "Adil K.",
  },
  {
    id: "DOC-2024-0888",
    title: "Q4 Budget Revision — Engineering Dept.",
    template: "Budget Memo",
    status: "Rejected",
    initiator: "Dmitry R.",
    currentApprover: "—",
  },
  {
    id: "DOC-2024-0887",
    title: "Vendor Qualification Form — LogiSoft",
    template: "Vendor Form",
    status: "Approved",
    initiator: "Nikita K.",
    currentApprover: "—",
  },
  {
    id: "DOC-2024-0886",
    title: "Employment Contract — Anna Petrova",
    template: "HR Contract",
    status: "In Approval",
    initiator: "HR Department",
    currentApprover: "Adil K.",
  },
  {
    id: "DOC-2024-0885",
    title: "Software License Agreement — Figma Enterprise",
    template: "License Agreement",
    status: "Draft",
    initiator: "Adil K.",
    currentApprover: "—",
  },
];

const PENDING_APPROVAL: {
  id: string;
  title: string;
  template: string;
  initiator: string;
  submitted: string;
  priority: "Urgent" | "Normal";
}[] = [
  {
    id: "DOC-2024-0889",
    title: "NDA with TechPartners LLC",
    template: "Non-Disclosure Agreement",
    initiator: "Maria K.",
    submitted: "Today, 09:41",
    priority: "Urgent",
  },
  {
    id: "DOC-2024-0886",
    title: "Employment Contract — Anna Petrova",
    template: "HR Contract",
    initiator: "HR Department",
    submitted: "Today, 11:05",
    priority: "Normal",
  },
  {
    id: "DOC-2024-0883",
    title: "Office Lease Renewal — Block B",
    template: "Real Estate Contract",
    initiator: "Sergey L.",
    submitted: "Yesterday, 17:30",
    priority: "Urgent",
  },
  {
    id: "DOC-2024-0879",
    title: "Annual Maintenance Agreement — Cisco",
    template: "Service Contract",
    initiator: "Dmitry R.",
    submitted: "Feb 14, 14:20",
    priority: "Normal",
  },
];

type ActivityType = "created" | "approved" | "rejected" | "submitted";

const ACTIVITY: {
  user: string;
  initials: string;
  action: ActivityType;
  docId: string;
  docTitle: string;
  time: string;
}[] = [
  {
    user: "Elena Volkova",
    initials: "EV",
    action: "approved",
    docId: "DOC-2024-0890",
    docTitle: "Internal Transfer Order #IT-4412",
    time: "5 min ago",
  },
  {
    user: "Adil Kaliyev",
    initials: "AK",
    action: "submitted",
    docId: "DOC-2024-0891",
    docTitle: "Procurement Contract — Azure Cloud Services",
    time: "22 min ago",
  },
  {
    user: "Boris Nikitin",
    initials: "BN",
    action: "rejected",
    docId: "DOC-2024-0888",
    docTitle: "Q4 Budget Revision — Engineering Dept.",
    time: "1 hr ago",
  },
  {
    user: "Nikita Korobov",
    initials: "NK",
    action: "created",
    docId: "DOC-2024-0887",
    docTitle: "Vendor Qualification Form — LogiSoft",
    time: "2 hr ago",
  },
  {
    user: "Maria Kuznetsova",
    initials: "MK",
    action: "submitted",
    docId: "DOC-2024-0889",
    docTitle: "NDA with TechPartners LLC",
    time: "3 hr ago",
  },
  {
    user: "Sergey Lebedev",
    initials: "SL",
    action: "approved",
    docId: "DOC-2024-0885",
    docTitle: "Software License Agreement — Figma Enterprise",
    time: "Yesterday",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    "In Approval": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "Approved":    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    "Rejected":    "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    "Draft":       "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
  };
  return map[status] ?? "bg-zinc-100 text-zinc-500";
}

function activityMeta(action: ActivityType): { label: string; color: string } {
  const map: Record<ActivityType, { label: string; color: string }> = {
    created:   { label: "created",                  color: "text-zinc-500"    },
    submitted: { label: "submitted for approval",   color: "text-amber-600"   },
    approved:  { label: "approved",                 color: "text-emerald-600" },
    rejected:  { label: "rejected",                 color: "text-rose-600"    },
  };
  return map[action];
}

function activityDot(action: ActivityType): string {
  const map: Record<ActivityType, string> = {
    created:   "bg-zinc-300",
    submitted: "bg-amber-400",
    approved:  "bg-emerald-400",
    rejected:  "bg-rose-400",
  };
  return map[action];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Good morning, Adil
        </h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Document management overview — 17 February 2026
        </p>
      </div>

      {/* ── Metric Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <p className="text-[12.5px] font-medium uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-zinc-900">
                {stat.value}
              </span>
              <span
                className={`text-[12px] font-medium ${
                  stat.trend === "up" ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {stat.change} this week
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Recent Documents table — 2/3 */}
        <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">
              Recent Documents
            </h3>
            <button
              type="button"
              className="text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              View all
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.2fr_100px_1fr_1fr] gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-2.5">
            {["Title", "Template", "Status", "Initiator", "Current Approver"].map(
              (col) => (
                <span
                  key={col}
                  className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
                >
                  {col}
                </span>
              )
            )}
          </div>

          {/* Table rows */}
          <div className="divide-y divide-zinc-100">
            {RECENT_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-[2fr_1.2fr_100px_1fr_1fr] items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors"
              >
                {/* Title */}
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-zinc-900">
                    {doc.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-zinc-400">{doc.id}</p>
                </div>

                {/* Template */}
                <p className="truncate text-[12.5px] text-zinc-500">
                  {doc.template}
                </p>

                {/* Status */}
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(doc.status)}`}
                >
                  {doc.status}
                </span>

                {/* Initiator */}
                <p className="truncate text-[12.5px] text-zinc-600">
                  {doc.initiator}
                </p>

                {/* Current Approver */}
                <p className="truncate text-[12.5px] text-zinc-600">
                  {doc.currentApprover}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Awaiting My Approval — 1/3 */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">
              Awaiting My Approval
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11.5px] font-semibold text-amber-700">
              {PENDING_APPROVAL.length}
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {PENDING_APPROVAL.map((doc) => (
              <div key={doc.id} className="px-5 py-4 space-y-3">
                {/* Doc info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-zinc-900 leading-snug">
                      {doc.title}
                    </p>
                    {doc.priority === "Urgent" && (
                      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600 ring-1 ring-rose-200">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] text-zinc-400">
                    {doc.template}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-zinc-400">
                    <span>
                      From:{" "}
                      <span className="text-zinc-600">{doc.initiator}</span>
                    </span>
                    <span>·</span>
                    <span>{doc.submitted}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="text-[14px] font-semibold text-zinc-900">
            Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-zinc-100">
          {ACTIVITY.map((item, idx) => {
            const meta = activityMeta(item.action);
            return (
              <div key={idx} className="flex items-center gap-4 px-5 py-3">
                {/* Avatar */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                  {item.initials}
                </div>

                {/* Action dot */}
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${activityDot(item.action)}`}
                />

                {/* Message */}
                <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-500">
                  <span className="font-medium text-zinc-900">{item.user}</span>{" "}
                  <span className={`font-medium ${meta.color}`}>
                    {meta.label}
                  </span>{" "}
                  <span className="font-medium text-zinc-700">
                    {item.docTitle}
                  </span>{" "}
                  <span className="text-zinc-400">({item.docId})</span>
                </p>

                {/* Time */}
                <span className="shrink-0 text-[12px] text-zinc-400">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
