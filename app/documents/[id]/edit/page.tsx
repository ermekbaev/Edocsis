"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentHistory } from "@/app/components/document-history";
import { DocumentComments } from "@/app/components/document-comments";
import { DocumentFiles } from "@/app/components/document-files";
import { DocumentContentViewer } from "@/app/components/document-content-viewer";
import { DocumentFieldsEditor } from "@/app/components/document-fields-editor";

interface DocumentData {
  id: string;
  number: string;
  title: string;
  status: string;
  templateId: string;
  fieldValues: Record<string, any> | null;
  template: {
    id: string;
    name: string;
    content: string | null;
    fields: any;
  };
  initiator: {
    name: string;
  };
}

export default function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setDocumentId(p.id));
  }, [params]);

  useEffect(() => {
    if (!documentId) return;

    async function fetchDocument() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setDocument(data);
          setTitle(data.title);
        } else {
          setError("Failed to load document");
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [documentId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!documentId) return;

    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save document");
      }

      const updated = await res.json();
      setDocument(updated);
      setTitle(updated.title);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFieldValues(fieldValues: Record<string, any>) {
    if (!documentId) return;

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fieldValues }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to save field values");
    }

    const updated = await res.json();
    setDocument(updated);
  }

  async function handleSubmitForApproval() {
    if (!documentId || !window.confirm("Submit this document for approval?")) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${documentId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit document");
      }

      router.push("/documents");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!documentId || !window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete document");
      }

      router.push("/documents");
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Document not found
          </h2>
        </div>
      </div>
    );
  }

  const canEdit = document.status === "DRAFT";
  const hasTemplateFields = document.template.fields && Array.isArray(document.template.fields) && document.template.fields.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[13px]">
        <Link
          href="/documents"
          className="text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Documents
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{document.number}</span>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Edit</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Edit Document
          </h2>
          <p className="mt-1 text-[14px] text-zinc-500">
            {document.number} — {document.template.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] text-zinc-500">Status:</span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            document.status === "DRAFT"
              ? "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200"
              : document.status === "IN_APPROVAL"
              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              : document.status === "APPROVED"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          }`}
        >
          {document.status}
        </span>
      </div>

      {/* Edit Form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-[12.5px] font-medium text-zinc-700 mb-1.5"
            >
              Document Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit || saving}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
              placeholder="Enter document title"
            />
          </div>

          {/* Template (read-only) */}
          <div>
            <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">
              Template
            </label>
            <div className="text-[13px] text-zinc-600">{document.template.name}</div>
          </div>

          {/* Initiator (read-only) */}
          <div>
            <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">
              Initiator
            </label>
            <div className="text-[13px] text-zinc-600">{document.initiator.name}</div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/documents")}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {!canEdit && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
              This document cannot be edited because it is no longer in DRAFT status.
            </div>
          )}
        </form>
      </div>

      {/* Document Fields Editor (if template has fields) */}
      {hasTemplateFields && (
        <DocumentFieldsEditor
          fields={document.template.fields}
          initialValues={document.fieldValues}
          onSave={handleSaveFieldValues}
          disabled={!canEdit}
        />
      )}

      {/* Document Content Viewer (if template has content) */}
      {document.template.content && (
        <DocumentContentViewer
          template={document.template}
          fieldValues={document.fieldValues}
        />
      )}

      {/* Document History */}
      {documentId && <DocumentHistory documentId={documentId} />}

      {/* Files */}
      {documentId && <DocumentFiles documentId={documentId} />}

      {/* Comments */}
      {documentId && <DocumentComments documentId={documentId} />}
    </div>
  );
}
