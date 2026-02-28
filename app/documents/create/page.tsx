"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "date" | "select" | "textarea" | "number";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required: boolean;
  fullWidth?: boolean;
}

interface ApprovalStep {
  id: string;
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
  description: string | null;
  content: string | null;
  fields: FieldDef[] | null;
  approvalRoute: ApprovalRoute | null;
  createdBy: { name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Shared input classes
const inputCls =
  "h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors";

const selectCls =
  "h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateDocumentPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedApproverId, setSelectedApproverId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Load templates from API
  useEffect(() => {
    async function loadTemplates() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch("/api/templates", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to load templates");
        }

        const data = await res.json();
        console.log("Loaded templates:", data);
        setTemplates(data);

        // Load approvers
        const approversRes = await fetch("/api/approvers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (approversRes.ok) {
          const approverUsers = await approversRes.json();
          setApprovers(approverUsers);
        }

        setError(null);
      } catch (error) {
        console.error("Error loading templates:", error);
        setError(error instanceof Error ? error.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const template = templates.find((t) => t.id === selectedTemplateId) ?? null;

  function handleTemplateChange(id: string | null) {
    setSelectedTemplateId(id);
    setFormValues({});
    setTitle("");
    setSelectedApproverId(null);
  }

  function handleFieldChange(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(asDraft: boolean) {
    if (!title.trim()) {
      alert("Please enter a document title");
      return;
    }
    if (!template && attachedFiles.length === 0) {
      alert("Please select a template or attach at least one file");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Step 1: Create document (always as DRAFT)
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          templateId: template?.id ?? undefined,
          fieldValues: template ? formValues : undefined,
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || "Failed to create document");
      }

      const newDocument = await createRes.json();

      // Step 2: Upload attached files
      for (const file of attachedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`/api/documents/${newDocument.id}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      // Step 3: If not draft, submit for approval
      if (!asDraft) {
        const submitRes = await fetch(`/api/documents/${newDocument.id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approverId: selectedApproverId || undefined,
          }),
        });

        if (!submitRes.ok) {
          const errorData = await submitRes.json();
          throw new Error(errorData.error || "Failed to submit for approval");
        }
      }

      // Redirect to the created document
      window.location.href = `/documents/${newDocument.id}`;
    } catch (error) {
      console.error("Error creating document:", error);
      alert(error instanceof Error ? error.message : "Failed to create document");
    }
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <BackIcon />
        Back to Documents
      </Link>

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Create Document
        </h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Select a template, fill in the required fields, then save or submit for approval.
        </p>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Left column: template + dynamic fields ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Template selector */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Select Template
              </h3>
              <p className="mt-0.5 text-[12.5px] text-zinc-400">
                Choose a document type to load the appropriate form fields.
              </p>
            </div>

            <div className="px-5 py-5 space-y-3">
              {/* Dropdown */}
              <div className="relative">
                <select
                  value={selectedTemplateId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    handleTemplateChange(val);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3.5 pr-9 text-[13px] text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? "Loading templates..." : error ? `Error: ${error}` : templates.length === 0 ? "No templates available" : "— Select a template —"}
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                  <ChevronIcon />
                </span>
              </div>

              {/* Template description */}
              {template ? (
                <div className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" aria-hidden="true" />
                  <p className="text-[12.5px] leading-relaxed text-zinc-500">
                    {template.description || "No description available"}
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 py-8">
                  <p className="text-[13px] text-zinc-400">
                    Loading...
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 py-8">
                  <p className="text-[13px] text-zinc-400">
                    No template selected. Select one above to continue.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic fields — rendered only after a template is selected */}
          {template && template.fields && template.fields.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">
                      Document Fields
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-zinc-400">
                      Fields specific to{" "}
                      <span className="font-medium text-zinc-600">
                        {template.name}
                      </span>
                      . Required fields marked{" "}
                      <span className="text-rose-500">*</span>
                    </p>
                  </div>
                  {/* Required vs optional count */}
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-zinc-400">
                      {template.fields.filter((f) => f.required).length} required
                      {" / "}
                      {template.fields.filter((f) => !f.required).length} optional
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  {template.fields.map((field) => (
                    <div
                      key={field.key}
                      className={field.fullWidth ? "sm:col-span-2" : ""}
                    >
                      <label className="mb-1.5 block text-[12px] font-medium text-zinc-600">
                        {field.label}
                        {field.required && (
                          <span className="ml-0.5 text-rose-500">*</span>
                        )}
                        {!field.required && (
                          <span className="ml-1.5 text-[10.5px] font-normal text-zinc-400">
                            optional
                          </span>
                        )}
                      </label>

                      {/* Select */}
                      {field.type === "select" && (
                        <div className="relative">
                          <select
                            value={formValues[field.key] ?? ""}
                            onChange={(e) =>
                              handleFieldChange(field.key, e.target.value)
                            }
                            className={selectCls}
                          >
                            <option value="">Select…</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
                            <ChevronIcon />
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      {field.type === "date" && (
                        <input
                          type="date"
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          className={inputCls}
                        />
                      )}

                      {/* Textarea */}
                      {field.type === "textarea" && (
                        <textarea
                          rows={3}
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
                        />
                      )}

                      {/* Text */}
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* File Attachments */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">Attachments</h3>
              <p className="mt-0.5 text-[12.5px] text-zinc-400">
                Optional. PDF, DOCX, XLSX, JPG, PNG — max 10 MB each.
              </p>
            </div>
            <div className="px-5 py-5 space-y-3">
              {/* Drop zone */}
              <label
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${
                  dragOver ? "border-zinc-400 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const dropped = Array.from(e.dataTransfer.files);
                  setAttachedFiles((prev) => [...prev, ...dropped]);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-[12.5px] text-zinc-400">
                  Drag & drop files here or{" "}
                  <span className="font-medium text-zinc-600">browse</span>
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    setAttachedFiles((prev) => [...prev, ...selected]);
                    e.target.value = "";
                  }}
                />
              </label>

              {/* File list */}
              {attachedFiles.length > 0 && (
                <ul className="space-y-1.5">
                  {attachedFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="truncate text-[12.5px] text-zinc-700">{file.name}</span>
                        <span className="shrink-0 text-[11px] text-zinc-400">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-2 shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: details + approval route + actions ── */}
        <div className="space-y-6">

          {/* Document Details */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Document Details
              </h3>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Title input */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-zinc-600">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    template
                      ? `e.g. ${template.name} — ${new Date().getFullYear()}`
                      : "Enter document title…"
                  }
                  className={inputCls}
                />
              </div>

              {/* Metadata */}
              <div className="space-y-3 border-t border-zinc-100 pt-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Initiator
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-[9px] font-semibold text-white">
                      AK
                    </div>
                    <p className="text-[13px] font-medium text-zinc-800">
                      Adil Kaliyev
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Date
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-zinc-800">
                    {today}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Template
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-zinc-700">
                    {template?.name ?? (
                      <span className="text-zinc-400">Not selected</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Status
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                    Draft
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Approver Selection — when no template, or template has no approval route */}
          {(!template || !template.approvalRoute) && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  Select Approver
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  {template ? "This template has no approval route" : "Choose who will approve this document"}
                </p>
              </div>

              <div className="px-5 py-5">
                <div className="relative">
                  <select
                    value={selectedApproverId ?? ""}
                    onChange={(e) => setSelectedApproverId(e.target.value || null)}
                    className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3.5 pr-9 text-[13px] text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">— Select approver —</option>
                    {approvers.map((approver) => (
                      <option key={approver.id} value={approver.id}>
                        {approver.name} ({approver.role})
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                    <ChevronIcon />
                  </span>
                </div>
                {approvers.length === 0 && (
                  <p className="mt-2 text-[11.5px] text-zinc-400">
                    No approvers available. Please contact an administrator.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Approval Route — only when template selected */}
          {template && template.approvalRoute && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  Approval Route
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  Steps after submission
                </p>
              </div>

              <div className="px-5 py-4">
                {template.approvalRoute?.steps && template.approvalRoute.steps.length > 0 ? (
                  <ol className="space-y-0">
                    {template.approvalRoute.steps.map((step, idx) => {
                      const isLast = idx === template.approvalRoute!.steps.length - 1;
                      return (
                        <li key={step.id} className="relative flex gap-3">
                          {/* Connector line */}
                          {!isLast && (
                            <span
                              className="absolute left-[9px] top-5 h-full w-px bg-zinc-100"
                              aria-hidden="true"
                            />
                          )}
                          {/* Step number */}
                          <span className="relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
                            {step.stepNumber}
                          </span>
                          {/* Content */}
                          <div className={`${isLast ? "" : "pb-4"}`}>
                            <p className="text-[13px] font-medium text-zinc-800">
                              {step.name}
                            </p>
                            {step.description && (
                              <p className="text-[11.5px] text-zinc-400">
                                {step.description}
                              </p>
                            )}
                            {step.requireAll && (
                              <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                                All must approve
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-[13px] text-zinc-400">
                    No approval route configured
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 space-y-2.5">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex w-full items-center justify-center rounded-lg bg-zinc-900 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!title.trim() || (!template && attachedFiles.length === 0)}
            >
              Submit for Approval
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white py-2.5 text-[13px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!title.trim() || (!template && attachedFiles.length === 0)}
            >
              Save as Draft
            </button>
            <p className="text-center text-[11px] text-zinc-400">
              Drafts can be edited and submitted later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
