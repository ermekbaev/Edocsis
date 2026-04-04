"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserAccess = "Admin" | "User";

interface Position {
  id: string;
  name: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  access: UserAccess;
  createdDate: string;
  position?: Position | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accessBadge(access: UserAccess): string {
  return access === "Admin"
    ? "bg-zinc-900 text-white"
    : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(id: string): string {
  const palette = [
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
  ];
  const idx = id.charCodeAt(0) % palette.length;
  return palette[idx];
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || `Ошибка ${res.status}`;
  } catch {
    return `Ошибка сервера (${res.status})`;
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors";
const selectCls = "h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50";

// ─── Create User Modal ────────────────────────────────────────────────────────

interface CreateUserModalProps {
  positions: Position[];
  onClose: () => void;
  onSubmit: (data: {
    name: string; email: string; role: string;
    password: string; department?: string; positionId?: string;
  }) => Promise<void>;
}

function CreateUserModal({ positions, onClose, onSubmit }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [access, setAccess] = useState<UserAccess>("User");
  const [positionId, setPositionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("Введите ФИО"); return; }
    if (!email.trim()) { setError("Введите электронную почту"); return; }
    if (!password) { setError("Введите пароль"); return; }
    if (password.length < 6) { setError("Пароль — минимум 6 символов"); return; }
    setError(""); setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(), email: email.trim(),
        role: access === "Admin" ? "ADMIN" : "USER",
        password,
        department: department.trim() || undefined,
        positionId: positionId || undefined,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать пользователя");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900">Создать пользователя</h3>
            <p className="mt-0.5 text-[12.5px] text-zinc-400">Добавить нового пользователя в систему.</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <XIcon />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-[12.5px] font-medium text-emerald-900">Пользователь успешно создан!</p>
            </div>
          )}
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</div>}

          <Field label="ФИО">
            <input type="text" placeholder="Иванов Иван Иванович" value={name}
              onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Электронная почта">
            <input type="email" placeholder="user@company.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Пароль">
            <input type="password" placeholder="Мин. 6 символов" value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Отдел (необязательно)">
            <input type="text" placeholder="напр. ИТ, HR, Финансы" value={department}
              onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
          </Field>
          <Field label={`Должность${positions.length === 0 ? " (справочник пуст)" : ""}`}>
            <select value={positionId} onChange={(e) => setPositionId(e.target.value)}
              disabled={positions.length === 0} className={selectCls}>
              <option value="">— Не назначена —</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Права">
            <select value={access} onChange={(e) => setAccess(e.target.value as UserAccess)} className={selectCls}>
              <option value="User">Пользователь</option>
              <option value="Admin">Администратор</option>
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
            Отмена
          </button>
          {!success && (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
              {submitting ? "Создание..." : "Создать пользователя"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: SystemUser;
  positions: Position[];
  onClose: () => void;
  onSubmit: (data: {
    name: string; role: string; department?: string;
    positionId?: string; password?: string;
  }) => Promise<void>;
}

function EditUserModal({ user, positions, onClose, onSubmit }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department || "");
  const [access, setAccess] = useState<UserAccess>(user.access);
  const [positionId, setPositionId] = useState(user.position?.id || "");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("Введите ФИО"); return; }
    if (newPassword && newPassword.length < 6) { setError("Пароль — минимум 6 символов"); return; }
    setError(""); setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        role: access === "Admin" ? "ADMIN" : "USER",
        department: department.trim() || undefined,
        positionId: positionId || undefined,
        password: newPassword || undefined,
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900">Редактировать пользователя</h3>
            <p className="mt-0.5 text-[12.5px] text-zinc-400">{user.email}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <XIcon />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-[12.5px] font-medium text-emerald-900">Изменения сохранены!</p>
            </div>
          )}
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</div>}

          <Field label="ФИО">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Электронная почта">
            <input type="text" value={user.email} disabled
              className={inputCls + " opacity-50 cursor-not-allowed"} />
          </Field>
          <Field label="Отдел (необязательно)">
            <input type="text" placeholder="напр. ИТ, HR, Финансы" value={department}
              onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
          </Field>
          <Field label={`Должность${positions.length === 0 ? " (справочник пуст)" : ""}`}>
            <select value={positionId} onChange={(e) => setPositionId(e.target.value)}
              disabled={positions.length === 0} className={selectCls}>
              <option value="">— Не назначена —</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Права">
            <select value={access} onChange={(e) => setAccess(e.target.value as UserAccess)} className={selectCls}>
              <option value="User">Пользователь</option>
              <option value="Admin">Администратор</option>
            </select>
          </Field>
          <Field label="Новый пароль (оставьте пустым, чтобы не менять)">
            <input type="password" placeholder="Мин. 6 символов" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
            Отмена
          </button>
          {!success && (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
              {submitting ? "Сохранение..." : "Сохранить"}
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
        setUsers(data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department,
          access: u.role === "ADMIN" ? "Admin" : "User" as UserAccess,
          createdDate: new Date(u.createdAt).toLocaleDateString("ru-RU", {
            year: "numeric", month: "short", day: "numeric",
          }),
          position: u.position ?? null,
        })));
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

  async function handleCreateUser(data: {
    name: string; email: string; role: string;
    password: string; department?: string; positionId?: string;
  }) {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await parseApiError(res));
    const result = await res.json();
    setUsers((prev) => [{
      id: result.id, name: result.name, email: result.email,
      department: result.department,
      access: result.role === "ADMIN" ? "Admin" : "User",
      createdDate: new Date(result.createdAt).toLocaleDateString("ru-RU", {
        year: "numeric", month: "short", day: "numeric",
      }),
      position: result.position ?? null,
    }, ...prev]);
  }

  async function handleEditUser(userId: string, data: {
    name: string; role: string; department?: string;
    positionId?: string; password?: string;
  }) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await parseApiError(res));
    const result = await res.json();
    setUsers((prev) => prev.map((u) =>
      u.id === userId ? {
        ...u,
        name: result.name,
        department: result.department,
        access: result.role === "ADMIN" ? "Admin" : "User",
        position: result.position ?? null,
      } : u
    ));
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!window.confirm(`Вы уверены, что хотите удалить «${userName}»?`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert(await parseApiError(res)); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Пользователи</h2>
          <p className="mt-1 text-[14px] text-zinc-500">Загрузка...</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {createOpen && (
        <CreateUserModal
          positions={positions}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateUser}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          positions={positions}
          onClose={() => setEditingUser(null)}
          onSubmit={(data) => handleEditUser(editingUser.id, data)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Пользователи</h2>
            <p className="mt-1 text-[14px] text-zinc-500">Управление пользователями и ролями.</p>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700">
            <span className="text-[16px] leading-none font-light">+</span>
            Создать пользователя
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Всего пользователей", value: users.length },
            { label: "Администраторы", value: users.filter((u) => u.access === "Admin").length },
            { label: "Пользователи", value: users.filter((u) => u.access === "User").length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <p className="text-[11.5px] font-medium uppercase tracking-wide text-zinc-400">{stat.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[28%]">Имя</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Эл. почта</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Права</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Должность</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 whitespace-nowrap">Дата создания</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-40">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-zinc-400">
                      Пользователей пока нет
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-zinc-50">
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(user.id)}`}>
                          {initials(user.name)}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900 leading-snug">{user.name}</p>
                          {user.department && (
                            <p className="text-[11px] text-zinc-400">{user.department}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">{user.email}</p>
                    </td>
                    {/* Access */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${accessBadge(user.access)}`}>
                        {user.access === "Admin" ? "АДМИНИСТРАТОР" : "ПОЛЬЗОВАТЕЛЬ"}
                      </span>
                    </td>
                    {/* Position */}
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-zinc-500">
                        {user.position?.name ?? <span className="italic text-zinc-300">Не назначена</span>}
                      </p>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-zinc-500 whitespace-nowrap">{user.createdDate}</p>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setEditingUser(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300">
                          <EditIcon />Изменить
                        </button>
                        <button type="button" onClick={() => handleDeleteUser(user.id, user.name)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-300">
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3">
            <p className="text-[12px] text-zinc-400">
              <span className="font-medium text-zinc-600">{users.length}</span> всего пользователей
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
