"use client";

import { useState } from "react";
import type { TaskNode } from "@/app/data/tasks";
import { TASK_STATUS_STYLES } from "@/app/data/tasks";

/* ---- icons ---- */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function MilestoneIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-violet-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PhaseIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-blue-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-zinc-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

const TYPE_ICON = {
  milestone: MilestoneIcon,
  phase: PhaseIcon,
  task: TaskIcon,
} as const;

/* ---- hours bar ---- */

function HoursBar({ planned, actual }: { planned: number; actual: number }) {
  if (planned === 0) return <span className="text-[12px] text-zinc-300">--</span>;
  const pct = Math.min((actual / planned) * 100, 100);
  const over = actual > planned;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-14 rounded-full bg-zinc-100">
        <div
          className={`h-1 rounded-full transition-all ${over ? "bg-rose-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[12px] tabular-nums ${over ? "text-rose-600" : "text-zinc-500"}`}>
        {actual}h
      </span>
    </div>
  );
}

/* ---- single row ---- */

function TaskRow({ node, depth }: { node: TaskNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const Icon = TYPE_ICON[node.type];

  const paddingLeft = 20 + depth * 24;

  return (
    <>
      <div
        className="group grid grid-cols-[1fr_100px_100px_120px] items-center gap-2 border-b border-zinc-50 px-5 py-2.5 transition-colors hover:bg-zinc-50 lg:grid-cols-[1fr_140px_100px_100px_120px]"
        role="row"
      >
        {/* Task name with hierarchy indent */}
        <div
          className="flex min-w-0 items-center gap-2"
          style={{ paddingLeft }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-zinc-200"
            >
              <ChevronIcon open={open} />
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <Icon />
          <span
            className={`truncate text-[13px] ${
              node.type === "task"
                ? "text-zinc-700"
                : "font-medium text-zinc-900"
            }`}
          >
            {node.title}
          </span>
          <span
            className={`ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${TASK_STATUS_STYLES[node.status]}`}
          >
            {node.status}
          </span>
        </div>

        {/* Assignees */}
        <div className="hidden shrink-0 items-center -space-x-1 lg:flex">
          {node.assignees.slice(0, 3).map((a) => (
            <div
              key={a.initials}
              title={a.name}
              className="flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[9px] font-semibold text-zinc-600"
            >
              {a.initials}
            </div>
          ))}
          {node.assignees.length > 3 && (
            <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[8px] font-medium text-zinc-500">
              +{node.assignees.length - 3}
            </div>
          )}
        </div>

        {/* Dates */}
        <span className="text-[12px] tabular-nums text-zinc-500">
          {node.startDate} – {node.endDate}
        </span>

        {/* Plan */}
        <span className="text-[12px] tabular-nums text-zinc-500">
          {node.plannedHours}h
        </span>

        {/* Fact */}
        <HoursBar planned={node.plannedHours} actual={node.actualHours} />
      </div>

      {/* Children */}
      {hasChildren && open && (
        <TaskTree nodes={node.children!} depth={depth + 1} />
      )}
    </>
  );
}

/* ---- tree ---- */

export function TaskTree({ nodes, depth }: { nodes: TaskNode[]; depth: number }) {
  return (
    <div role="rowgroup">
      {nodes.map((node) => (
        <TaskRow key={node.id} node={node} depth={depth} />
      ))}
    </div>
  );
}
