"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface ApprovalStep {
  stepNumber: number;
  name: string;
  description?: string;
  approverIds: string[];
  requireAll: boolean;
}

interface ApprovalRoute {
  id: string;
  name: string;
  description?: string;
  steps: ApprovalStep[];
}

interface Template {
  id: string;
  name: string;
  description?: string;
  content?: string;
  fields?: FieldDef[];
  createdAt: string;
  createdBy: {
    name: string;
  };
  approvalRoute?: ApprovalRoute;
  _count: {
    documents: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fieldTypeBadge(type: string): string {
  const map: Record<string, string> = {
    text: "bg-zinc-100 text-zinc-600",
    date: "bg-sky-50 text-sky-700",
    number: "bg-amber-50 text-amber-700",
    textarea: "bg-emerald-50 text-emerald-700",
  };
  return map[type.toLowerCase()] || "bg-zinc-100 text-zinc-600";
}

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const templateId = params.id as string;

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/templates/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError("Template not found");
          } else {
            setError("Failed to load template");
          }
          return;
        }

        const data = await res.json();
        setTemplate(data);
      } catch (err) {
        console.error("Failed to fetch template:", err);
        setError("Failed to load template");
      } finally {
        setLoading(false);
      }
    }

    fetchTemplate();
  }, [templateId]);

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Loading...
            </h2>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !template) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
          >
            <BackIcon />
            Back to Templates
          </Link>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-4">
            <p className="text-[14px] text-rose-700">{error || "Template not found"}</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  const fields = (template.fields || []) as FieldDef[];
  const steps = template.approvalRoute?.steps || [];

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* ── Back link ──────────────────────────────────────────────────────── */}
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <BackIcon />
          Back to Templates
        </Link>

        {/* ── Template Header ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: name + description */}
            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] font-semibold tracking-tight text-zinc-900">
                {template.name}
              </h1>
              {template.description && (
                <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-zinc-500">
                  {template.description}
                </p>
              )}
            </div>
          </div>

          {/* Metadata strip */}
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-zinc-100 pt-5 sm:grid-cols-4">
            {[
              { label: "Created By", value: template.createdBy.name },
              {
                label: "Created Date",
                value: new Date(template.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
              },
              {
                label: "Used In",
                value: `${template._count.documents} document${
                  template._count.documents !== 1 ? "s" : ""
                }`,
              },
              {
                label: "Total Fields",
                value: `${fields.length} field${fields.length !== 1 ? "s" : ""}`,
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  {label}
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-zinc-700">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ── Left Column — 2/3 ── */}
          <div className="xl:col-span-2 space-y-6">
            {/* Document Content */}
            {template.content && (
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <div className="border-b border-zinc-100 px-5 py-4">
                  <h3 className="text-[14px] font-semibold text-zinc-900">
                    Document Content
                  </h3>
                  <p className="mt-0.5 text-[12px] text-zinc-400">
                    Template with variables marked as {"{{"}"fieldName"{"}}"}
                  </p>
                </div>
                <div className="px-5 py-4 bg-zinc-50">
                  <pre className="text-[12.5px] leading-relaxed text-zinc-700 whitespace-pre-wrap font-mono">
                    {template.content}
                  </pre>
                </div>
              </div>
            )}

            {/* Document Fields */}
            {fields.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">
                      Document Fields
                    </h3>
                    <p className="mt-0.5 text-[12px] text-zinc-400">
                      {fields.length} fields —{" "}
                      {fields.filter((f) => f.required).length} required,{" "}
                      {fields.filter((f) => !f.required).length} optional
                    </p>
                  </div>
                </div>

                {/* Fields table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Field Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Field Key
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {fields.map((field) => (
                      <tr key={field.key} className="hover:bg-zinc-50 transition-colors">
                        {/* Field Name */}
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-semibold text-zinc-900">
                            {field.label}
                          </p>
                        </td>

                        {/* Field Key */}
                        <td className="px-4 py-3.5">
                          <code className="text-[11.5px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                            {"{{"}{field.key}{"}}"}
                          </code>
                        </td>

                        {/* Field Type */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${fieldTypeBadge(
                              field.type
                            )}`}
                          >
                            {field.type}
                          </span>
                        </td>

                        {/* Required */}
                        <td className="px-4 py-3.5">
                          {field.required ? (
                            <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
                              Optional
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right column — 1/3 ── */}
          <div className="space-y-6">
            {/* Template stats */}
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">Template Info</h3>
              </div>
              <div className="divide-y divide-zinc-100">
                {[
                  { label: "Total Fields", value: fields.length },
                  {
                    label: "Required Fields",
                    value: fields.filter((f) => f.required).length,
                  },
                  {
                    label: "Optional Fields",
                    value: fields.filter((f) => !f.required).length,
                  },
                  { label: "Approval Steps", value: steps.length },
                  { label: "Used In", value: `${template._count.documents} docs` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <p className="text-[12.5px] text-zinc-500">{label}</p>
                    <p className="text-[13px] font-semibold text-zinc-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval workflow */}
            {steps.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <div className="border-b border-zinc-100 px-5 py-4">
                  <h3 className="text-[14px] font-semibold text-zinc-900">
                    Approval Workflow
                  </h3>
                  <p className="mt-0.5 text-[12px] text-zinc-400">
                    {steps.length}-step {steps.length === 1 ? "process" : "sequential process"}
                  </p>
                </div>

                <div className="px-5 py-5">
                  <ol className="space-y-0">
                    {steps.map((step, idx) => {
                      const isLast = idx === steps.length - 1;
                      return (
                        <li key={step.stepNumber} className="relative flex gap-4">
                          {/* Connector */}
                          {!isLast && (
                            <span
                              className="absolute left-[13px] top-6 h-full w-px bg-zinc-100"
                              aria-hidden="true"
                            />
                          )}

                          {/* Step circle */}
                          <div className="relative z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-[11px] font-bold text-zinc-600">
                            {step.stepNumber}
                          </div>

                          {/* Content */}
                          <div className={`min-w-0 ${isLast ? "" : "pb-5"}`}>
                            <p className="text-[13px] font-semibold text-zinc-900 leading-snug">
                              {step.name}
                            </p>
                            {step.description && (
                              <p className="mt-0.5 text-[12px] leading-snug text-zinc-400">
                                {step.description}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-[11px] text-zinc-400">
                                {step.approverIds.length} approver
                                {step.approverIds.length !== 1 ? "s" : ""}
                              </span>
                              {step.requireAll && step.approverIds.length > 1 && (
                                <>
                                  <span className="text-zinc-300">·</span>
                                  <span className="text-[11px] font-medium text-amber-600">
                                    All must approve
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {/* Sequential note */}
                  {steps.length > 1 && (
                    <div className="mt-5 flex items-start gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3.5 py-3">
                      <span
                        className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400"
                        aria-hidden="true"
                      />
                      <p className="text-[12px] leading-relaxed text-zinc-500">
                        Steps are executed sequentially. Each approver is notified only
                        after the previous step is completed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
