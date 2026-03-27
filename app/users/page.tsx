"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserAccess = "Admin" | "User";
type UserStatus = "Active" | "Pending" | "Disabled";

interface Position {
  id: string;
  name: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  access: UserAccess;
  status: UserStatus;
  createdDate: string;
  position?: Position | null;
}

const ACCESS_LABELS: Record<UserAccess, string> = {
  Admin: "Администратор",
  User: "Пользователь",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  Active: "Активные",
  Pending: "Ожидание",
  Disabled: "Отключённые",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accessBadge(access: UserAccess): string {
  return access === "Admin"
    ? "bg-zinc-900 text-white"
    : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
}

function statusBadge(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    role: string;
    password: string;
    department?: string;
    positionId?: string;
  }) => Promise<void>;
  positions: Position[];
}

function CreateUserModal({ onClose, onSubmit, positions }: CreateUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [access, setAccess] = useState<UserAccess>("User");
  const [positionId, setPositionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim()) {
      setError("Введите ФИО пользователя");
      return;
    }
    if (!email.trim()) {
      setError("Введите электронную почту");
      return;
    }
    if (!password) {
      setError("Введите пароль");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onSubmit({
        name: fullName.trim(),
        email: email.trim(),
        role: access === "Admin" ? "ADMIN" : "USER",
        password,
        department: department.trim() || undefined,
        positionId: positionId || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Не удалось создать пользователя");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900">
              Создать пользователя
            </h3>
            <p className="mt-0.5 text-[12.5px] text-zinc-400">
              Добавить нового пользователя в систему.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Закрыть"
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
                Пользователь успешно создан!
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
              ФИО
            </label>
            <input
              id="invite-name"
              type="text"
              placeholder="напр. Иван Петров"
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
              Электронная почта
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
              Пароль
            </label>
            <input
              id="invite-password"
              type="password"
              placeholder="Мин. 6 символов"
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
              Отдел (необязательно)
            </label>
            <input
              id="invite-department"
              type="text"
              placeholder="напр. ИТ, HR, Финансы"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Role (from positions справочник) */}
          <div>
            <label
              htmlFor="invite-position"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Роль {positions.length === 0 && <span className="font-normal text-zinc-400">(справочник пуст)</span>}
            </label>
            <div className="relative">
              <select
                id="invite-position"
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                disabled={positions.length === 0}
                className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
              >
                <option value="">— Не назначена —</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>

          {/* Права */}
          <div>
            <label
              htmlFor="invite-access"
              className="mb-1.5 block text-[12.5px] font-medium text-zinc-700"
            >
              Права
            </label>
            <div className="relative">
              <select
                id="invite-access"
                value={access}
                onChange={(e) => setAccess(e.target.value as UserAccess)}
                className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
              >
                <option value="User">Пользователь</option>
                <option value="Admin">Администратор</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-zinc-400">
              {access === "Admin"
                ? "Полный доступ ко всем функциям системы, включая управление пользователями."
                : "Может создавать документы и шаблоны. Видит только свои документы."}
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
            Отмена
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Создание..." : "Создать пользователя"}
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
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [usersRes, positionsRes] = await Promise.all([
          fetch("/api/users", { headers }),
          fetch("/api/positions", { headers }),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          const mapped: SystemUser[] = data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            access: (user.role === "ADMIN" ? "Admin" : "User") as UserAccess,
            status: "Active" as UserStatus,
            createdDate: new Date(user.createdAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            position: user.position ?? null,
          }));
          setUsers(mapped);
        }

        if (positionsRes.ok) {
          const data = await positionsRes.json();
          setPositions(data.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleCreateUser(data: {
    name: string;
    email: string;
    role: string;
    password: string;
    department?: string;
    positionId?: string;
  }) {
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
      throw new Error(error.error || "Не удалось создать пользователя");
    }

    const result = await res.json();
    const newUser: SystemUser = {
      id: result.id,
      name: result.name,
      email: result.email,
      access: result.role === "ADMIN" ? "Admin" : "User",
      status: "Active",
      createdDate: new Date(result.createdAt).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      position: result.position ?? null,
    };

    setUsers([newUser, ...users]);
  }

  async function handleUpdatePosition(userId: string, newPositionId: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ positionId: newPositionId || null }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Не удалось обновить должность");
      return;
    }

    const updatedUser = await res.json();
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, position: updatedUser.position ?? null } : u,
      ),
    );
    setEditingPosition(null);
  }

  async function handleUpdateAccess(userId: string, newAccess: UserAccess) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newAccess === "Admin" ? "ADMIN" : "USER" }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Не удалось обновить права");
      return;
    }

    const updatedUser = await res.json();
    setUsers(
      users.map((u) =>
        u.id === userId
          ? { ...u, access: updatedUser.role === "ADMIN" ? "Admin" : "User" }
          : u,
      ),
    );
    setEditingRole(null);
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!window.confirm(`Вы уверены, что хотите удалить "${userName}"?`)) {
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
      alert(error.error || "Не удалось удалить пользователя");
      return;
    }

    setUsers(users.filter((u) => u.id !== userId));
  }

  const activeCount = users.filter((u) => u.status === "Active").length;
  const pendingCount = users.filter((u) => u.status === "Pending").length;

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Пользователи
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">Загрузка...</p>
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
          positions={positions}
        />
      )}

      <div className="space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Пользователи
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Управление пользователями и ролями.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            <span className="text-[16px] leading-none font-light">+</span>
            Создать пользователя
          </button>
        </div>

        {/* ── Summary strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Всего пользователей", value: users.length },
            { label: "Активные", value: activeCount },
            { label: "Ожидание", value: pendingCount },
            {
              label: "Отключённые",
              value: users.length - activeCount - pendingCount,
            },
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
                    Имя
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Эл. почта
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-27.5">
                    Права
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-35">
                    Роль
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[100px]">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">
                    Дата создания
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[140px]">
                    Действия
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

                    {/* Права */}
                    <td className="px-4 py-3.5">
                      {editingRole === user.id ? (
                        <select
                          value={user.access}
                          onChange={(e) =>
                            handleUpdateAccess(user.id, e.target.value as UserAccess)
                          }
                          onBlur={() => setEditingRole(null)}
                          autoFocus
                          className="h-7 appearance-none rounded-lg border border-zinc-300 bg-white pl-2 pr-6 text-[11px] font-semibold focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                          <option value="User">ПОЛЬЗОВАТЕЛЬ</option>
                          <option value="Admin">АДМИНИСТРАТОР</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingRole(user.id)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-75 ${accessBadge(user.access)}`}
                        >
                          {ACCESS_LABELS[user.access].toUpperCase()}
                        </button>
                      )}
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3.5">
                      {editingPosition === user.id ? (
                        <select
                          value={user.position?.id ?? ""}
                          onChange={(e) =>
                            handleUpdatePosition(user.id, e.target.value)
                          }
                          onBlur={() => setEditingPosition(null)}
                          autoFocus
                          className="h-7 appearance-none rounded-lg border border-zinc-300 bg-white pl-2 pr-6 text-[12px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                          <option value="">— Не назначена —</option>
                          {positions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingPosition(user.id)}
                          className="text-[12.5px] text-zinc-500 hover:text-zinc-800 hover:underline whitespace-nowrap"
                        >
                          {user.position?.name ?? (
                            <span className="text-zinc-300 italic">Не назначена</span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge(user.status)}`}
                      >
                        {STATUS_LABELS[user.status]}
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
                          Удалить
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
              всего пользователей —{" "}
              <span className="font-medium text-zinc-600">{activeCount}</span>{" "}
              активных
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
