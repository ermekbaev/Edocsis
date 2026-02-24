"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalRouteStep {
  id: string;
  stepNumber: number;
  name: string;
  description: string | null;
  approverIds: string[];
  requireAll: boolean;
}

interface ApprovalRoute {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  template: {
    id: string;
    name: string;
  } | null;
  steps: ApprovalRouteStep[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/routes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setRoutes(data);
        }
      } catch (err) {
        console.error("Failed to fetch routes:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  async function handleDeleteRoute(routeId: string, routeName: string) {
    if (!window.confirm(`Are you sure you want to delete "${routeName}"?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/routes/${routeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Failed to delete route");
      return;
    }

    setRoutes(routes.filter((r) => r.id !== routeId));
  }

  const totalSteps = routes.reduce((sum, r) => sum + r.steps.length, 0);

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Approval Routes
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
      <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Approval Routes
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Manage approval workflows for document templates.
          </p>
        </div>
        <Link
          href="/routes/create"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          <span className="text-[16px] leading-none font-light">+</span>
          Create Route
        </Link>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Routes", value: routes.length },
          { label: "Total Steps", value: totalSteps },
          { label: "Avg Steps/Route", value: routes.length > 0 ? (totalSteps / routes.length).toFixed(1) : "0" },
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

      {/* ── Routes List ───────────────────────────────────────────────────── */}
      {routes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-[14px] text-zinc-500">
            No approval routes yet.{" "}
            <Link href="/routes/create" className="font-medium text-zinc-900 hover:underline">
              Create your first route
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
            >
              {/* Route Header */}
              <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-zinc-900">
                      {route.name}
                    </h3>
                    {route.description && (
                      <p className="mt-1 text-[13px] text-zinc-500">
                        {route.description}
                      </p>
                    )}
                    {route.template && (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                          Template: {route.template.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoute(route.id, route.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-300"
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </div>
              </div>

              {/* Route Steps */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {route.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-3 flex-1">
                      {/* Step Number */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[13px] font-semibold text-white">
                        {step.stepNumber}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-900 leading-snug">
                          {step.name}
                        </p>
                        {step.description && (
                          <p className="mt-0.5 text-[11.5px] text-zinc-500 leading-snug">
                            {step.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            {step.approverIds.length} approver{step.approverIds.length !== 1 ? 's' : ''}
                          </span>
                          {step.requireAll && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 ring-1 ring-amber-200">
                              All required
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      {idx < route.steps.length - 1 && (
                        <div className="flex items-center pt-3">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-zinc-300"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
