"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

type ApproverMode = "users" | "role";

interface StepForm {
  stepNumber: number;
  name: string;
  description: string;
  approverMode: ApproverMode;
  approverRole: string;
  approverIds: string[];
  requireAll: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateRoutePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [steps, setSteps] = useState<StepForm[]>([
    { stepNumber: 1, name: "", description: "", approverMode: "users", approverRole: "", approverIds: [], requireAll: false },
  ]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        // Fetch templates without approval routes
        const templatesRes = await fetch("/api/templates", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (templatesRes.ok) {
          const allTemplates = await templatesRes.json();
          // Filter templates that don't have approval routes
          const available = allTemplates.filter((t: any) => !t.approvalRoute);
          setTemplates(available);
        }

        // Fetch users who can be approvers (APPROVER and ADMIN roles)
        const usersRes = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          const approverUsers = allUsers.filter((u: User) =>
            u.role === "APPROVER" || u.role === "ADMIN"
          );
          setApprovers(approverUsers);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load templates and users");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function addStep() {
    const nextStepNumber = steps.length + 1;
    setSteps([
      ...steps,
      { stepNumber: nextStepNumber, name: "", description: "", approverMode: "users", approverRole: "", approverIds: [], requireAll: false },
    ]);
  }

  function removeStep(index: number) {
    if (steps.length === 1) return; // Keep at least one step
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setSteps(newSteps);
  }

  function updateStep(index: number, field: keyof StepForm, value: any) {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  }

  function toggleApprover(stepIndex: number, approverId: string) {
    const step = steps[stepIndex];
    const isSelected = step.approverIds.includes(approverId);

    const newApproverIds = isSelected
      ? step.approverIds.filter(id => id !== approverId)
      : [...step.approverIds, approverId];

    updateStep(stepIndex, "approverIds", newApproverIds);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Validate
      if (!name.trim()) {
        throw new Error("Route name is required");
      }
      if (!templateId) {
        throw new Error("Template is required");
      }
      if (steps.some(s => !s.name.trim())) {
        throw new Error("All steps must have a name");
      }
      if (steps.some(s => s.approverMode === "users" && s.approverIds.length === 0)) {
        throw new Error("All steps in 'users' mode must have at least one approver selected");
      }
      if (steps.some(s => s.approverMode === "role" && !s.approverRole)) {
        throw new Error("All steps in 'role' mode must have a role selected");
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          templateId,
          steps: steps.map(s => ({
            stepNumber: s.stepNumber,
            name: s.name.trim(),
            description: s.description.trim() || undefined,
            approverIds: s.approverMode === "users" ? s.approverIds : [],
            approverRole: s.approverMode === "role" ? s.approverRole : null,
            requireAll: s.requireAll,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create route");
      }

      // Redirect to routes page
      window.location.href = "/routes";
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Create Approval Route
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Loading...
            </p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (templates.length === 0) {
    return (
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Create Approval Route
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              Configure multi-step approval workflows for templates.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
            <p className="text-[14px] text-zinc-500">
              No templates available. All templates already have approval routes, or you need to{" "}
              <Link href="/templates/create" className="font-medium text-zinc-900 hover:underline">
                create a template first
              </Link>
              .
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
        <div>
          <Link
            href="/routes"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Routes
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Create Approval Route
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            Configure multi-step approval workflows for templates.
          </p>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Details */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">
              Route Details
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Route Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none"
                  placeholder="e.g., Standard Contract Approval"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none resize-none"
                  placeholder="Optional description of this approval route"
                />
              </div>

              {/* Template */}
              <div>
                <label htmlFor="template" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Template <span className="text-rose-500">*</span>
                </label>
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 transition-colors focus:border-zinc-900 focus:outline-none"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11.5px] text-zinc-400">
                  Only templates without existing approval routes are shown
                </p>
              </div>
            </div>
          </div>

          {/* Approval Steps */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-zinc-900">
                Approval Steps
              </h3>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                <span className="text-[14px] leading-none font-light">+</span>
                Add Step
              </button>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[13px] font-semibold text-white">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Step Name */}
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-1">
                          Step Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(index, "name", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none"
                          placeholder="e.g., Department Head Approval"
                          required
                        />
                      </div>

                      {/* Step Description */}
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-1">
                          Step Description
                        </label>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => updateStep(index, "description", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none"
                          placeholder="Optional description"
                        />
                      </div>

                      {/* Approver assignment — mode toggle */}
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-2">
                          Approvers <span className="text-rose-500">*</span>
                        </label>

                        {/* Mode toggle */}
                        <div className="mb-3 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit gap-0.5">
                          {([
                            { value: "users", label: "Specific users" },
                            { value: "role",  label: "By role"         },
                          ] as { value: ApproverMode; label: string }[]).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateStep(index, "approverMode", opt.value)}
                              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                step.approverMode === opt.value
                                  ? "bg-white text-zinc-900 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-700"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* By role */}
                        {step.approverMode === "role" && (
                          <div className="space-y-1.5">
                            <div className="relative">
                              <select
                                value={step.approverRole}
                                onChange={(e) => updateStep(index, "approverRole", e.target.value)}
                                className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-[13px] text-zinc-700 focus:border-zinc-900 focus:outline-none cursor-pointer"
                              >
                                <option value="">Select a role…</option>
                                <option value="APPROVER">Approver — all users with Approver role</option>
                                <option value="ADMIN">Admin — all users with Admin role</option>
                              </select>
                              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                              </span>
                            </div>
                            {step.approverRole && (
                              <p className="text-[11.5px] text-zinc-500">
                                All current and future users with role <strong>{step.approverRole}</strong> will be notified and can approve.
                              </p>
                            )}
                          </div>
                        )}

                        {/* By specific users */}
                        {step.approverMode === "users" && (
                          <div>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
                              {approvers.length === 0 ? (
                                <p className="p-3 text-[12px] text-zinc-400">
                                  No approvers available. Create users with APPROVER or ADMIN role.
                                </p>
                              ) : (
                                approvers.map((approver) => (
                                  <label
                                    key={approver.id}
                                    className="flex items-center gap-3 px-3 py-2 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={step.approverIds.includes(approver.id)}
                                      onChange={() => toggleApprover(index, approver.id)}
                                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-zinc-900">
                                        {approver.name}
                                      </p>
                                      <p className="text-[11.5px] text-zinc-500">
                                        {approver.email} · {approver.role}
                                      </p>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                            {step.approverIds.length > 0 && (
                              <p className="mt-1.5 text-[11.5px] text-zinc-500">
                                {step.approverIds.length} approver{step.approverIds.length !== 1 ? 's' : ''} selected
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Require All */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.requireAll}
                            onChange={(e) => updateStep(index, "requireAll", e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span className="text-[13px] text-zinc-700">
                            Require all approvers to approve
                          </span>
                        </label>
                        <p className="mt-1 ml-6 text-[11.5px] text-zinc-400">
                          {step.requireAll
                            ? "All selected approvers must approve before moving to the next step"
                            : "Any one of the selected approvers can approve to move to the next step"}
                        </p>
                      </div>
                    </div>

                    {/* Remove Step */}
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
              <p className="text-[13px] text-rose-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/routes"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Route"}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
