import Link from "next/link";
import { PROJECTS, STATUS_STYLES } from "@/app/data/projects";

const COLUMNS = [
  "Name",
  "Key",
  "Start date",
  "End date",
  "Status",
  "Project manager",
] as const;

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Projects
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            {PROJECTS.length} projects across your organization
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create project
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-zinc-100">
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-left text-[11.5px] font-semibold uppercase tracking-wider text-zinc-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {PROJECTS.map((project) => (
                <tr
                  key={project.id}
                  className="group transition-colors hover:bg-zinc-50"
                >
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-[13.5px] font-medium text-zinc-900 group-hover:text-zinc-700"
                    >
                      {project.name}
                    </Link>
                  </td>

                  {/* Key */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[12px] font-mono font-medium text-zinc-600">
                      {project.key}
                    </span>
                  </td>

                  {/* Start date */}
                  <td className="px-5 py-3.5 text-[13px] text-zinc-500">
                    {project.startDate}
                  </td>

                  {/* End date */}
                  <td className="px-5 py-3.5 text-[13px] text-zinc-500">
                    {project.endDate}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${STATUS_STYLES[project.status]}`}
                    >
                      {project.status}
                    </span>
                  </td>

                  {/* Manager */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
                        {project.manager.initials}
                      </div>
                      <span className="text-[13px] text-zinc-700">
                        {project.manager.name}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
