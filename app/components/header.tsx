"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon, BellIcon, MenuIcon } from "./icons";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/documents": "Documents",
  "/templates": "Templates",
  "/approvals": "My Approvals",
  "/users": "Users",
  "/settings": "Settings",
  "/profile": "My Profile",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const matched = Object.keys(PAGE_TITLES).find(
    (key) => key !== "/" && pathname.startsWith(key),
  );
  return matched ? PAGE_TITLES[matched] : "Dashboard";
}

// ─── Search mock data ─────────────────────────────────────────────────────────

const SEARCH_DOCS = [
  {
    id: "DOC-2024-0891",
    title: "Procurement Contract — Azure Cloud Services",
    status: "In Approval",
  },
  {
    id: "DOC-2024-0889",
    title: "NDA with TechPartners LLC",
    status: "In Approval",
  },
  {
    id: "DOC-2024-0887",
    title: "Vendor Qualification Form — LogiSoft",
    status: "Approved",
  },
  {
    id: "DOC-2024-0885",
    title: "Software License Agreement — Figma Enterprise",
    status: "Draft",
  },
  {
    id: "DOC-2024-0883",
    title: "Annual Maintenance Agreement — Cisco",
    status: "Approved",
  },
];

const SEARCH_TEMPLATES = [
  { id: "tpl-001", name: "Service Contract", category: "Legal" },
  { id: "tpl-002", name: "Non-Disclosure Agreement", category: "Legal" },
  { id: "tpl-003", name: "HR Contract", category: "HR" },
  { id: "tpl-007", name: "DPA Template", category: "Compliance" },
];

const SEARCH_USERS = [
  { id: "usr-001", name: "Adil Kaliyev", email: "a.kaliyev@edocsis.com" },
  { id: "usr-002", name: "Elena Volkova", email: "e.volkova@edocsis.com" },
  {
    id: "usr-004",
    name: "Maria Kuznetsova",
    email: "m.kuznetsova@edocsis.com",
  },
  { id: "usr-005", name: "Sergey Lebedev", email: "s.lebedev@edocsis.com" },
];

// ─── Notifications mock data ──────────────────────────────────────────────────

type NotifType = "approved" | "rejected" | "assigned" | "deadline";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: Notif[] = [
  {
    id: "n1",
    type: "approved",
    title: "Document Approved",
    body: "Vendor Qualification Form — LogiSoft was approved by Elena Volkova.",
    time: "Just now",
    read: false,
  },
  {
    id: "n2",
    type: "assigned",
    title: "New Document Assigned",
    body: "NDA with TechPartners LLC requires your approval.",
    time: "2h ago",
    read: false,
  },
  {
    id: "n3",
    type: "deadline",
    title: "Deadline Reminder",
    body: "Annual Maintenance Agreement — Cisco is due tomorrow.",
    time: "5h ago",
    read: false,
  },
  {
    id: "n4",
    type: "rejected",
    title: "Document Rejected",
    body: "Q4 Budget Revision — Engineering Dept. was rejected.",
    time: "1d ago",
    read: true,
  },
  {
    id: "n5",
    type: "approved",
    title: "Document Approved",
    body: "Travel Policy Amendment — Q1 2026 was approved.",
    time: "2d ago",
    read: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docStatusColor(status: string): string {
  const m: Record<string, string> = {
    "In Approval": "text-amber-600",
    Approved: "text-emerald-600",
    Draft: "text-zinc-400",
    Rejected: "text-rose-600",
  };
  return m[status] ?? "text-zinc-400";
}

const NOTIF_STYLE: Record<NotifType, { bg: string; icon: string }> = {
  approved: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  rejected: { bg: "bg-rose-50", icon: "text-rose-600" },
  assigned: { bg: "bg-indigo-50", icon: "text-indigo-600" },
  deadline: { bg: "bg-amber-50", icon: "text-amber-600" },
};

function nameInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Inline icon components ───────────────────────────────────────────────────

function SmallDocIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SmallTemplateIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function NotifIcon({ type }: { type: NotifType }) {
  const { bg, icon } = NOTIF_STYLE[type];
  const s = { className: `h-[13px] w-[13px]` };
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg} ${icon}`}
    >
      {type === "approved" && (
        <svg
          {...s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {type === "rejected" && (
        <svg
          {...s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      {type === "deadline" && (
        <svg
          {...s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}
      {type === "assigned" && (
        <svg
          {...s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )}
    </span>
  );
}

function ProfileMenuIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GearMenuIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutMenuIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuClick: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = resolveTitle(pathname);
  const currentUser = useCurrentUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<null | "search" | "user">(
    null,
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Get user display data
  const userName = currentUser?.name || "User";
  const userEmail = currentUser?.email || "user@edocsis.com";
  const userRole = currentUser?.role || "USER";
  const userInitials = nameInitials(userName);
  const userShortName = userName.split(" ")[0] + " " + (userName.split(" ")[1]?.[0] || "") + ".";

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (searchRef.current?.contains(t) || userRef.current?.contains(t))
        return;
      setActivePanel(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setActivePanel(null);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on route change
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePanel(null);
      setSearchQuery("");
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  // ── Derived: filtered search results ──
  const q = searchQuery.toLowerCase().trim();

  const filteredDocs = SEARCH_DOCS.filter(
    (d) =>
      !q || d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
  ).slice(0, 4);

  const filteredTpls = SEARCH_TEMPLATES.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q),
  ).slice(0, 3);

  const filteredUsers = SEARCH_USERS.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q),
  ).slice(0, 3);

  const hasResults =
    filteredDocs.length > 0 ||
    filteredTpls.length > 0 ||
    filteredUsers.length > 0;

  function toggle(panel: "search" | "user") {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  function closeSearch() {
    setActivePanel(null);
    setSearchQuery("");
  }

  async function handleLogout() {
    try {
      // Call logout API to clear httpOnly cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Notify components that user data has been cleared
      window.dispatchEvent(new Event("user-updated"));

      // Redirect to login
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* ── Left: hamburger + page title ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
          aria-label="Toggle navigation"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-zinc-900">{title}</h1>
      </div>

      {/* ── Center: global search ─────────────────────────────────────────── */}
      <div ref={searchRef} className="mx-6 hidden max-w-md flex-1 md:block">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setActivePanel("search")}
            placeholder="Search documents, templates, users…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}

          {/* ── Search dropdown ── */}
          {activePanel === "search" && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden z-50">
              {q && !hasResults ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[13px] text-zinc-400">
                    No results for{" "}
                    <span className="font-medium text-zinc-600">
                      &quot;{searchQuery}&quot;
                    </span>
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {/* Documents group */}
                  {filteredDocs.length > 0 && (
                    <div>
                      <p className="px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                        Documents
                      </p>
                      {filteredDocs.map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/documents/${doc.id}`}
                          onClick={closeSearch}
                          className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-100 text-zinc-500">
                            <SmallDocIcon />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-medium text-zinc-800">
                              {doc.title}
                            </p>
                            <p
                              className={`text-[11px] font-medium ${docStatusColor(doc.status)}`}
                            >
                              {doc.status} · {doc.id}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Templates group */}
                  {filteredTpls.length > 0 && (
                    <div className="border-t border-zinc-100">
                      <p className="px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                        Templates
                      </p>
                      {filteredTpls.map((tpl) => (
                        <Link
                          key={tpl.id}
                          href={`/templates/${tpl.id}`}
                          onClick={closeSearch}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-50 text-indigo-500">
                            <SmallTemplateIcon />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-medium text-zinc-800">
                              {tpl.name}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {tpl.category}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Users group */}
                  {filteredUsers.length > 0 && (
                    <div className="border-t border-zinc-100">
                      <p className="px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                        Users
                      </p>
                      {filteredUsers.map((user) => (
                        <Link
                          key={user.id}
                          href="/users"
                          onClick={closeSearch}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-600">
                            {nameInitials(user.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-medium text-zinc-800">
                              {user.name}
                            </p>
                            <p className="truncate text-[11px] text-zinc-400">
                              {user.email}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2.5">
                    <Link
                      href="/documents"
                      onClick={closeSearch}
                      className="text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-700"
                    >
                      View all results →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: notifications + user ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* ── Bell / Notifications ── */}
        <NotificationsDropdown />

        <div className="mx-1 h-6 w-px bg-zinc-200" />

        {/* ── User menu ── */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => toggle("user")}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-100"
            aria-label="User menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-[11px] font-semibold text-white">
              {userInitials}
            </div>
            <span className="hidden text-[13px] font-medium text-zinc-700 sm:inline-block">
              {userShortName}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`hidden text-zinc-400 transition-transform sm:block ${activePanel === "user" ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* User dropdown */}
          {activePanel === "user" && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden z-50">
              {/* Identity */}
              <div className="border-b border-zinc-100 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-[11px] font-semibold text-white">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-zinc-900">
                      {userName}
                    </p>
                    <p className="truncate text-[11.5px] text-zinc-400">
                      {userEmail}
                    </p>
                  </div>
                </div>
                <span className="mt-2.5 inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {userRole}
                </span>
              </div>

              {/* Nav items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setActivePanel(null)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <span className="text-zinc-400">
                    <ProfileMenuIcon />
                  </span>
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setActivePanel(null)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <span className="text-zinc-400">
                    <GearMenuIcon />
                  </span>
                  Settings
                </Link>
              </div>

              <div className="border-t border-zinc-100 py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogoutMenuIcon />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
