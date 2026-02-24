"use client";

import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  metadata: any;
  user: {
    id: string;
    name: string;
  };
}

interface DocumentHistoryProps {
  documentId: string;
}

function getActionIcon(action: string) {
  switch (action) {
    case "created":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "updated":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "submitted":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      );
    case "approved":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      );
    case "rejected":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "created":
      return "bg-blue-100 text-blue-700";
    case "updated":
      return "bg-amber-100 text-amber-700";
    case "submitted":
      return "bg-indigo-100 text-indigo-700";
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

function getActionText(action: string) {
  switch (action) {
    case "created":
      return "created the document";
    case "updated":
      return "updated the document";
    case "submitted":
      return "submitted for approval";
    case "approved":
      return "approved the document";
    case "rejected":
      return "rejected the document";
    default:
      return action;
  }
}

export function DocumentHistory({ documentId }: DocumentHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/documents/${documentId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch document history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [documentId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">History</h3>
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">History</h3>
        <p className="text-[13px] text-zinc-500">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">History</h3>

      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={log.id} className="relative pl-8">
            {/* Timeline line */}
            {index !== logs.length - 1 && (
              <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-zinc-200" />
            )}

            {/* Icon */}
            <div
              className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full ${getActionColor(log.action)}`}
            >
              {getActionIcon(log.action)}
            </div>

            {/* Content */}
            <div className="min-h-[24px]">
              <p className="text-[13px] text-zinc-900">
                <span className="font-medium">{log.user.name}</span>{" "}
                <span className="text-zinc-600">{getActionText(log.action)}</span>
              </p>

              {log.metadata?.comment && (
                <div className="mt-1.5 rounded-lg bg-zinc-50 px-3 py-2">
                  <p className="text-[12px] text-zinc-600 italic">
                    "{log.metadata.comment}"
                  </p>
                </div>
              )}

              <p className="mt-1 text-[11.5px] text-zinc-400">
                {new Date(log.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
