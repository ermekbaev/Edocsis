"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Position {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  _count: { users: number };
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  positionId?: string | null;
  position?: { id: string; name: string } | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Position Modal ───────────────────────────────────────────────────────────

function PositionModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Position;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Введите название роли"); return; }
    setSaving(true); setError("");
    try {
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="text-[15px] font-semibold text-zinc-900">
            {initial ? "Редактировать роль" : "Создать роль"}
          </h3>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100">
            <XIcon />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-zinc-700">
              Название <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="напр. Бухгалтер, Юрист, Директор"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-zinc-700">
              Описание <span className="text-zinc-400">(необязательно)</span>
            </label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Краткое описание роли / должности"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors resize-none"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
            Отмена
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | undefined>(undefined);

  async function fetchData() {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const [posRes, usrRes] = await Promise.all([
      fetch("/api/positions", { headers }),
      fetch("/api/users", { headers }),
    ]);
    if (posRes.ok) setPositions(await posRes.json());
    if (usrRes.ok) setUsers(await usrRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function apiError(res: Response): Promise<string> {
    try {
      const data = await res.json();
      return data.error || `Ошибка ${res.status}`;
    } catch {
      return `Ошибка сервера (${res.status})`;
    }
  }

  async function handleSavePosition(name: string, description: string) {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    if (editingPosition) {
      const res = await fetch(`/api/positions/${editingPosition.id}`, {
        method: "PUT", headers, body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const updated = await res.json();
      setPositions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const res = await fetch("/api/positions", {
        method: "POST", headers, body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const created = await res.json();
      setPositions((prev) => [...prev, created]);
    }
    setEditingPosition(undefined);
  }

  async function handleDeletePosition(pos: Position) {
    if (!window.confirm(`Удалить роль «${pos.name}»? Пользователи не будут удалены.`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/positions/${pos.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert(await apiError(res)); return; }
    setPositions((prev) => prev.filter((p) => p.id !== pos.id));
    setUsers((prev) => prev.map((u) => u.positionId === pos.id ? { ...u, positionId: null, position: null } : u));
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Роли</h2>
          <p className="text-[14px] text-zinc-500">Загрузка...</p>
        </div>
      </RoleGuard>
    );
  }

  // Users with no position
  const unassigned = users.filter((u) => !u.positionId);

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {(modalOpen || editingPosition) && (
        <PositionModal
          initial={editingPosition}
          onClose={() => { setModalOpen(false); setEditingPosition(undefined); }}
          onSave={handleSavePosition}
        />
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Роли</h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Справочник должностей и группировка пользователей по ролям.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingPosition(undefined); setModalOpen(true); }}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700"
          >
            <PlusIcon />
            Создать роль
          </button>
        </div>

        {/* ── Table 1: Roles directory ─────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">Справочник ролей</h3>
            <p className="mt-0.5 text-[12px] text-zinc-400">
              Должности / роли в системе — {positions.length} записей
            </p>
          </div>

          {positions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-zinc-400">Роли ещё не созданы</p>
              <p className="mt-1 text-[12px] text-zinc-400">
                Нажмите «Создать роль» чтобы добавить первую запись
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Название роли</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Описание</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Пользователей</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-[130px]">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-[13px] font-semibold text-zinc-900">{pos.name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-zinc-500">{pos.description || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[12px] font-semibold text-zinc-600">
                        {pos._count.users}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingPosition(pos); setModalOpen(false); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                        >
                          <EditIcon />Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(pos)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Table 2: Users grouped by role ──────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">Пользователи по ролям</h3>
            <p className="mt-0.5 text-[12px] text-zinc-400">
              Привязка пользователей к должностям осуществляется в разделе «Пользователи».
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {/* Grouped by position */}
            {positions.map((pos) => {
              const posUsers = users.filter((u) => u.positionId === pos.id);
              return (
                <div key={pos.id}>
                  <div className="flex items-center gap-3 bg-zinc-50 px-6 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                      {pos.name}
                    </span>
                    <span className="text-[11.5px] text-zinc-400">{posUsers.length} чел.</span>
                  </div>
                  {posUsers.length === 0 ? (
                    <div className="px-6 py-3">
                      <p className="text-[12px] text-zinc-400 italic">Нет пользователей с этой ролью</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-zinc-50">
                        {posUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                                  {initials(user.name)}
                                </span>
                                <p className="text-[13px] font-medium text-zinc-900">{user.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-[12.5px] text-zinc-500">{user.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-[12.5px] text-zinc-500">{user.department || "—"}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            {/* Unassigned */}
            {unassigned.length > 0 && (
              <div>
                <div className="flex items-center gap-3 bg-zinc-50 px-6 py-2.5">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500">
                    Без роли
                  </span>
                  <span className="text-[11.5px] text-zinc-400">{unassigned.length} чел.</span>
                </div>
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-zinc-50">
                    {unassigned.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500">
                              {initials(user.name)}
                            </span>
                            <p className="text-[13px] font-medium text-zinc-900">{user.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12.5px] text-zinc-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12.5px] text-zinc-500">{user.department || "—"}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {positions.length === 0 && users.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-[13px] text-zinc-400">Нет данных</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
