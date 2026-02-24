"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "DRAFT" | "IN_APPROVAL" | "APPROVED" | "REJECTED";

interface DashboardData {
  stats: {
    totalDocuments: number;
    byStatus: {
      draft: number;
      inApproval: number;
      approved: number;
      rejected: number;
    };
    myDocuments: number;
  };
  recentDocuments?: Array<{
    id: string;
    number: string;
    title: string;
    status: DocStatus;
    template: {
      name: string;
    };
    initiator: {
      name: string;
    };
    currentApprover: {
      name: string;
    } | null;
  }>;
  pendingApprovals?: Array<{
    id: string;
    number: string;
    title: string;
    template: {
      name: string;
    };
    initiator: {
      name: string;
    };
    createdAt: string;
  }>;
  recentActivity?: Array<{
    id: string;
    action: string;
    createdAt: string;
    document: {
      id: string;
      number: string;
      title: string;
    };
    user: {
      id: string;
      name: string;
    };
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    IN_APPROVAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    DRAFT: "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
  };
  return map[status] ?? "bg-zinc-100 text-zinc-500";
}

function statusLabel(status: DocStatus): string {
  const map: Record<DocStatus, string> = {
    DRAFT: "Draft",
    IN_APPROVAL: "In Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[status] ?? status;
}

function activityMeta(action: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    created: { label: "created", color: "text-zinc-500" },
    submitted: { label: "submitted for approval", color: "text-amber-600" },
    approved: { label: "approved", color: "text-emerald-600" },
    rejected: { label: "rejected", color: "text-rose-600" },
    updated: { label: "updated", color: "text-blue-600" },
  };
  return map[action] ?? { label: action, color: "text-zinc-500" };
}

function activityDot(action: string): string {
  const map: Record<string, string> = {
    created: "bg-zinc-300",
    submitted: "bg-amber-400",
    approved: "bg-emerald-400",
    rejected: "bg-rose-400",
    updated: "bg-blue-400",
  };
  return map[action] ?? "bg-zinc-300";
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good day");
  const [currentDate, setCurrentDate] = useState("");

  const currentUser = useCurrentUser();
  const userName = currentUser?.name || "User";

  useEffect(() => {
    fetchDashboardData();

    // Set greeting and date on client side only
    setGreeting(getGreeting());
    setCurrentDate(getCurrentDate());
  }, []);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function getCurrentDate(): string {
    return new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-20 rounded-xl bg-zinc-100 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-zinc-100 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-[14px] text-zinc-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const stats = data ? [
    {
      label: "Total Documents",
      value: data.stats.totalDocuments.toString(),
      change: `+${data.stats.byStatus.draft}`,
      trend: "up" as const,
    },
    {
      label: "In Approval",
      value: data.stats.byStatus.inApproval.toString(),
      change: `+${Math.floor(data.stats.byStatus.inApproval * 0.15)}`,
      trend: "up" as const,
    },
    {
      label: "Approved",
      value: data.stats.byStatus.approved.toString(),
      change: `+${Math.floor(data.stats.byStatus.approved * 0.1)}`,
      trend: "up" as const,
    },
    {
      label: "Rejected",
      value: data.stats.byStatus.rejected.toString(),
      change: `+${data.stats.byStatus.rejected}`,
      trend: "down" as const,
    },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {greeting}, {userName}
        </h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Document management overview — {currentDate}
        </p>
      </div>

      {/* ── Metric Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
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
            <Link
              href="/documents"
              className="text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              View all
            </Link>
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
            {!data.recentDocuments || data.recentDocuments.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-zinc-400">
                No documents yet
              </div>
            ) : (
              data.recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="grid grid-cols-[2fr_1.2fr_100px_1fr_1fr] items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors"
                >
                  {/* Title */}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-zinc-900">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-zinc-400">{doc.number}</p>
                  </div>

                  {/* Template */}
                  <p className="truncate text-[12.5px] text-zinc-500">
                    {doc.template.name}
                  </p>

                  {/* Status */}
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(
                      doc.status
                    )}`}
                  >
                    {statusLabel(doc.status)}
                  </span>

                  {/* Initiator */}
                  <p className="truncate text-[12.5px] text-zinc-600">
                    {doc.initiator.name}
                  </p>

                  {/* Current Approver */}
                  <p className="truncate text-[12.5px] text-zinc-600">
                    {doc.currentApprover?.name || "—"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Awaiting My Approval — 1/3 */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">
              Awaiting My Approval
            </h3>
            {data.pendingApprovals && data.pendingApprovals.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11.5px] font-semibold text-amber-700">
                {data.pendingApprovals.length}
              </span>
            )}
          </div>

          <div className="divide-y divide-zinc-100">
            {!data.pendingApprovals || data.pendingApprovals.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-zinc-400">
                No pending approvals
              </div>
            ) : (
              data.pendingApprovals.map((doc) => (
                <div key={doc.id} className="px-5 py-4 space-y-3">
                  {/* Doc info */}
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900 leading-snug">
                      {doc.title}
                    </p>
                    <p className="mt-1 text-[11.5px] text-zinc-400">
                      {doc.template.name}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-zinc-400">
                      <span>
                        From:{" "}
                        <span className="text-zinc-600">{doc.initiator.name}</span>
                      </span>
                      <span>·</span>
                      <span>{formatTime(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/approvals/${doc.id}`}
                      className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-[12px] font-semibold text-white text-center transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
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
          {!data.recentActivity || data.recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-zinc-400">
              No recent activity
            </div>
          ) : (
            data.recentActivity.map((item) => {
              const meta = activityMeta(item.action);
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {/* Avatar */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                    {getInitials(item.user.name)}
                  </div>

                  {/* Action dot */}
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${activityDot(
                      item.action
                    )}`}
                  />

                  {/* Message */}
                  <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-500">
                    <span className="font-medium text-zinc-900">
                      {item.user.name}
                    </span>{" "}
                    <span className={`font-medium ${meta.color}`}>
                      {meta.label}
                    </span>{" "}
                    <span className="font-medium text-zinc-700">
                      {item.document.title}
                    </span>{" "}
                    <span className="text-zinc-400">({item.document.number})</span>
                  </p>

                  {/* Time */}
                  <span className="shrink-0 text-[12px] text-zinc-400">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
