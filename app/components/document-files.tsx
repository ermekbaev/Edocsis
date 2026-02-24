"use client";

import { useState, useEffect, useRef } from "react";

interface FileData {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface DocumentFilesProps {
  documentId: string;
}

export function DocumentFiles({ documentId }: DocumentFilesProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [documentId]);

  async function fetchFiles() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${documentId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${documentId}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const uploadedFile = await res.json();
      setFiles([uploadedFile, ...files]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete file");
      }

      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎬";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📊";
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return "🗜️";
    return "📎";
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Files</h3>
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">
        Files
        {files.length > 0 && (
          <span className="ml-2 text-[13px] font-normal text-zinc-500">
            ({files.length})
          </span>
        )}
      </h3>

      {/* Upload Area */}
      <div
        className={`mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            <p className="text-[13px] text-zinc-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📁</div>
            <p className="text-[13px] text-zinc-600">
              Drag and drop a file here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-zinc-900 underline hover:no-underline"
              >
                browse
              </button>
            </p>
            <p className="text-[11.5px] text-zinc-400">Maximum file size: 10MB</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </div>
      )}

      {/* Files List */}
      <div className="space-y-2">
        {files.length === 0 ? (
          <p className="text-[13px] text-zinc-500">No files uploaded yet.</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 hover:bg-zinc-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[13px] font-medium text-zinc-900 hover:underline truncate"
                  >
                    {file.name}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11.5px] text-zinc-500">
                      {formatFileSize(file.size)}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[11.5px] text-zinc-500">
                      {file.user.name}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[11.5px] text-zinc-400">
                      {new Date(file.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="ml-3 flex-shrink-0 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
