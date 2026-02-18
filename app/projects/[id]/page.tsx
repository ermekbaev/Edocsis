import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, STATUS_STYLES } from "@/app/data/projects";
import { PROJECT_TASKS } from "@/app/data/tasks";
import { TaskTree } from "./task-tree";

interface ProjectDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailProps) {
  const { id } = await params;
  const project = getProjectById(Number(id));

  if (!project) notFound();

  const tasks = PROJECT_TASKS[project.id] ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-zinc-400">
        <Link href="/projects" className="transition-colors hover:text-zinc-600">
          Projects
        </Link>
        <span>/</span>
        <span className="text-zinc-700">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {project.name}
          </h2>
          <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[12px] font-mono font-medium text-zinc-600">
            {project.key}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${STATUS_STYLES[project.status]}`}
          >
            {project.status}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoCard label="Start date" value={project.startDate} />
        <InfoCard label="End date" value={project.endDate} />
        <InfoCard
          label="Project manager"
          value={project.manager.name}
          avatar={project.manager.initials}
        />
        <InfoCard label="Contract" value="contract_v2.pdf" isFile />
      </div>

      {/* Tasks */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-[14px] font-semibold text-zinc-900">
            Work Breakdown
          </h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11.5px] font-medium text-zinc-600">
            {countTasks(tasks)} tasks
          </span>
        </div>

        {/* Column header */}
        <div className="grid grid-cols-[1fr_100px_100px_120px] items-center gap-2 border-b border-zinc-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 lg:grid-cols-[1fr_140px_100px_100px_120px]">
          <span>Task</span>
          <span className="hidden lg:block">Assignees</span>
          <span>Dates</span>
          <span>Plan</span>
          <span>Fact</span>
        </div>

        {tasks.length > 0 ? (
          <TaskTree nodes={tasks} depth={0} />
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-[13px] text-zinc-400">
              No tasks added to this project yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function countTasks(nodes: { children?: { children?: object[] }[] }[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children) count += countTasks(node.children);
  }
  return count;
}

/* ---------- sub-components ---------- */

function InfoCard({
  label,
  value,
  avatar,
  isFile,
}: {
  label: string;
  value: string;
  avatar?: string;
  isFile?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <p className="text-[11.5px] font-medium text-zinc-400">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {avatar && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
            {avatar}
          </div>
        )}
        {isFile && (
          <svg
            className="h-4 w-4 shrink-0 text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
        <span className="truncate text-[13.5px] font-medium text-zinc-900">
          {value}
        </span>
      </div>
    </div>
  );
}
