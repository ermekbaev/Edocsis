export type ProjectStatus = "Active" | "Planning" | "On Hold" | "Done";

export interface Person {
  name: string;
  initials: string;
}

export interface Project {
  id: number;
  name: string;
  key: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  manager: Person;
}

export const PROJECTS: Project[] = [
  {
    id: 1,
    name: "Website Redesign",
    key: "WEB",
    startDate: "Jan 10, 2026",
    endDate: "Mar 15, 2026",
    status: "Active",
    manager: { name: "Maria Kuznetsova", initials: "MK" },
  },
  {
    id: 2,
    name: "Mobile App v2.0",
    key: "MOB",
    startDate: "Feb 01, 2026",
    endDate: "Apr 02, 2026",
    status: "Active",
    manager: { name: "Dmitry Romanov", initials: "DR" },
  },
  {
    id: 3,
    name: "API Integration Platform",
    key: "API",
    startDate: "Dec 15, 2025",
    endDate: "Feb 28, 2026",
    status: "Active",
    manager: { name: "Timur Khasanov", initials: "TK" },
  },
  {
    id: 4,
    name: "Analytics Dashboard",
    key: "ANL",
    startDate: "Feb 10, 2026",
    endDate: "May 10, 2026",
    status: "Planning",
    manager: { name: "Nikita Kozlov", initials: "NK" },
  },
  {
    id: 5,
    name: "Auth Service Migration",
    key: "AUTH",
    startDate: "Jan 20, 2026",
    endDate: "Mar 20, 2026",
    status: "Active",
    manager: { name: "Timur Khasanov", initials: "TK" },
  },
  {
    id: 6,
    name: "Customer Portal",
    key: "CPT",
    startDate: "Nov 01, 2025",
    endDate: "Jan 31, 2026",
    status: "Done",
    manager: { name: "Sergey Lebedev", initials: "SL" },
  },
  {
    id: 7,
    name: "Payment Gateway v3",
    key: "PAY",
    startDate: "Mar 01, 2026",
    endDate: "Jun 15, 2026",
    status: "Planning",
    manager: { name: "Anna Rybakova", initials: "AR" },
  },
  {
    id: 8,
    name: "Infrastructure Monitoring",
    key: "INF",
    startDate: "Jan 05, 2026",
    endDate: "Feb 20, 2026",
    status: "On Hold",
    manager: { name: "Dmitry Romanov", initials: "DR" },
  },
  {
    id: 9,
    name: "Design System 2.0",
    key: "DSN",
    startDate: "Feb 15, 2026",
    endDate: "Apr 30, 2026",
    status: "Planning",
    manager: { name: "Maria Kuznetsova", initials: "MK" },
  },
  {
    id: 10,
    name: "Data Pipeline Refactor",
    key: "DPR",
    startDate: "Oct 01, 2025",
    endDate: "Dec 20, 2025",
    status: "Done",
    manager: { name: "Nikita Kozlov", initials: "NK" },
  },
];

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Planning: "bg-blue-50 text-blue-700",
  "On Hold": "bg-amber-50 text-amber-700",
  Done: "bg-zinc-100 text-zinc-500",
};

export function getProjectById(id: number): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
