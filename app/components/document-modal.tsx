"use client";

import { useState, useEffect } from "react";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; templateId: string }) => Promise<void>;
}

interface Template {
  id: string;
  name: string;
}

export function DocumentModal({ isOpen, onClose, onSubmit }: DocumentModalProps) {
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      async function fetchTemplates() {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/templates", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setTemplates(data);
            if (data.length > 0) {
              setTemplateId(data[0].id); // Select first template by default
            }
          }
        } catch (err) {
          console.error("Failed to fetch templates:", err);
        } finally {
          setLoading(false);
        }
      }

      fetchTemplates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!templateId) {
      setError("Template is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), templateId });
      onClose();
      setTitle("");
      setTemplateId("");
    } catch (err: any) {
      setError(err.message || "Failed to create document");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">Create Document</h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          Create a new document from a template
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-[12.5px] font-medium text-zinc-700 mb-1.5"
            >
              Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="e.g. Q1 Budget Proposal"
              disabled={submitting || loading}
            />
          </div>

          {/* Template */}
          <div>
            <label
              htmlFor="template"
              className="block text-[12.5px] font-medium text-zinc-700 mb-1.5"
            >
              Template <span className="text-rose-600">*</span>
            </label>
            {loading ? (
              <div className="text-[13px] text-zinc-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-[13px] text-rose-600">
                No templates available. Please create a template first.
              </div>
            ) : (
              <select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                disabled={submitting}
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading || templates.length === 0}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
