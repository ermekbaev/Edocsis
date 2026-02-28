"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole   = "Admin" | "Initiator" | "Approver" | "User";
type UserStatus = "Active" | "Pending" | "Disabled";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdDate: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const USERS: SystemUser[] = [
  {
    id: "usr-001",
    name: "Adil Kaliyev",
    email: "a.kaliyev@edocsis.com",
    role: "Admin",
    status: "Active",
    createdDate: "12 Jan 2026",
  },
  {
    id: "usr-002",
    name: "Elena Volkova",
    email: "e.volkova@edocsis.com",
    role: "Approver",
    status: "Active",
    createdDate: "12 Jan 2026",
  },
  {
    id: "usr-003",
    name: "Boris Nikitin",
    email: "b.nikitin@edocsis.com",
    role: "Approver",
    status: "Active",
    createdDate: "14 Jan 2026",
  },
  {
    id: "usr-004",
    name: "Maria Kuznetsova",
    email: "m.kuznetsova@edocsis.com",
    role: "User",
    status: "Active",
    createdDate: "15 Jan 2026",
  },
  {
    id: "usr-005",
    name: "Sergey Lebedev",
    email: "s.lebedev@edocsis.com",
    role: "User",
    status: "Active",
    createdDate: "16 Jan 2026",
  },
  {
    id: "usr-006",
    name: "Dmitry Ryabov",
    email: "d.ryabov@edocsis.com",
    role: "User",
    status: "Active",
    createdDate: "18 Jan 2026",
  },
  {
    id: "usr-007",
    name: "Nikita Korobov",
    email: "n.korobov@edocsis.com",
    role: "User",
    status: "Active",
    createdDate: "20 Jan 2026",
  },
  {
    id: "usr-008",
    name: "Anna Petrova",
    email: "a.petrova@edocsis.com",
    role: "User",
    status: "Pending",
    createdDate: "03 Feb 2026",
  },
  {
    id: "usr-009",
    name: "Viktor Sorokin",
    email: "v.sorokin@edocsis.com",
    role: "Approver",
    status: "Pending",
    createdDate: "10 Feb 2026",
  },
  {
    id: "usr-010",
    name: "Irina Belyaeva",
    email: "i.belyaeva@edocsis.com",
    role: "User",
    status: "Disabled",
    createdDate: "05 Jan 2026",
  },
];

const ROLE_OPTIONS: UserRole[] = ["User", "Initiator", "Approver", "Admin"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleBadge(role: UserRole): string {
  const map: Record<UserRole, string> = {
    Admin:     "bg-zinc-900 text-white",
    Initiator: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    Approver:  "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    User:      "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200",
  };
  return map[role];
}

function statusBadge(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    Active:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Pending:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    Disabled: "bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200",
  };
  return map[status];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(id: string): string {
  const palette = [
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100  text-amber-700",
    "bg-sky-100    text-sky-700",
    "bg-rose-100   text-rose-700",
  ];
  const idx = parseInt(id.replace("usr-", ""), 10) % palette.length;
  return palette[idx];
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: string; password: string; department?: string }) => Promise<void>;
}

function CreateUserModal({ onClose, onSubmit }: CreateUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole]         = useState<UserRole>("User");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  async function handleSubmit() {
    if (!canSubmit) return;

    setError("");
    setSubmitting(true);

    try {
      // Convert UI role to API role
      const apiRole = role === "Admin" ? "ADMIN" : role === "Initiator" ? "INITIATOR" : role === "Approver" ? "APPROVER" : "USER";
      await onSubmit({
        name: fullName.trim(),
        email: email.trim(),
        role: apiRole,
        password,
        department: department.trim() || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dialog */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900">
              Create User
            </h3>
            <p className="mt-0.5 text-[12.5px] text-zinc-400">
              Add a new user to the system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">

          {/* Success Display */}
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-[12.5px] font-medium text-emerald-900">
                User created successfully!
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              htmlFor="invite-name"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Full Name
            </label>
            <input
              id="invite-name"
              type="text"
              placeholder="e.g. Ivan Petrov"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Email Address
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="invite-password"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Password
            </label>
            <input
              id="invite-password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="invite-department"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Department (optional)
            </label>
            <input
              id="invite-department"
              type="text"
              placeholder="e.g. IT, HR, Finance"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="invite-role"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Role
            </label>
            <div className="relative">
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-zinc-400">
              {role === "Admin"
                ? "Full system access including user management and settings."
                : role === "Initiator"
                ? "Can create documents, fill in fields, and submit them for approval."
                : role === "Approver"
                ? "Can review, approve, or reject documents in assigned workflows."
                : "Can view their own documents but cannot create new ones."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const mapped: SystemUser[] = data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === "ADMIN" ? "Admin" : user.role === "INITIATOR" ? "Initiator" : user.role === "APPROVER" ? "Approver" : "User",
            status: "Active" as UserStatus, // TODO: implement status in DB
            createdDate: new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          }));
          setUsers(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  async function handleCreateUser(data: { name: string; email: string; role: string; password: string; department?: string }) {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create user");
    }

    const result = await res.json();
    const newUser: SystemUser = {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role === "ADMIN" ? "Admin" : result.role === "INITIATOR" ? "Initiator" : result.role === "APPROVER" ? "Approver" : "User",
      status: "Active",
      createdDate: new Date(result.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    setUsers([newUser, ...users]);
  }

  async function handleUpdateRole(userId: string, newRole: UserRole) {
    const token = localStorage.getItem("token");
    const apiRole = newRole === "Admin" ? "ADMIN" : newRole === "Initiator" ? "INITIATOR" : newRole === "Approver" ? "APPROVER" : "USER";

    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: apiRole }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Failed to update role");
      return;
    }

    const updatedUser = await res.json();
    setUsers(users.map((u) =>
      u.id === userId
        ? {
            ...u,
            role: updatedUser.role === "ADMIN" ? "Admin" : updatedUser.role === "INITIATOR" ? "Initiator" : updatedUser.role === "APPROVER" ? "Approver" : "User",
          }
        : u
    ));
    setEditingRole(null);
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!window.confirm(`Are you sure you want to delete "${userName}"?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Failed to delete user");
      return;
    }

    setUsers(users.filter((u) => u.id !== userId));
  }

  const activeCount  = users.filter((u) => u.status === "Active").length;
  const pendingCount = users.filter((u) => u.status === "Pending").length;

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Users
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Loading...
            </p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {modalOpen && (
        <CreateUserModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateUser}
        />
      )}

      <div className="space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Users
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Manage system users and roles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            <span className="text-[16px] leading-none font-light">+</span>
            Create User
          </button>
        </div>

        {/* ── Summary strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Users",  value: users.length },
            { label: "Active",       value: activeCount },
            { label: "Pending",      value: pendingCount },
            { label: "Disabled",     value: users.length - activeCount - pendingCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-4"
            >
              <p className="text-[11.5px] font-medium uppercase tracking-wide text-zinc-400">
                {stat.label}
              </p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Users Table ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">

              {/* Header */}
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[28%]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[110px]">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[100px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                    Created Date
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-zinc-50"
                  >
                    {/* Name + avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(user.id)}`}
                        >
                          {initials(user.name)}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900 leading-snug">
                            {user.name}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-400">
                            {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">
                        {user.email}
                      </p>
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3.5">
                      {editingRole === user.id ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                          onBlur={() => setEditingRole(null)}
                          autoFocus
                          className="h-7 appearance-none rounded-lg border border-zinc-300 bg-white pl-2 pr-6 text-[11px] font-semibold focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingRole(user.id)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-75 ${roleBadge(user.role)}`}
                        >
                          {user.role.toUpperCase()}
                        </button>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Created date */}
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">
                        {user.createdDate}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3">
            <p className="text-[12px] text-zinc-400">
              <span className="font-medium text-zinc-600">{users.length}</span>{" "}
              users total —{" "}
              <span className="font-medium text-zinc-600">{activeCount}</span> active
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
