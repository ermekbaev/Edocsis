"use client";

import { use, useEffect, useState } from "react";

export default function DocumentPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocument(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (document) {
      setTimeout(() => window.print(), 500);
    }
  }, [document]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-400">Подготовка документа...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-400">Документ не найден</p>
      </div>
    );
  }

  // Build document text
  let text = document.template?.content || "";
  text = text.replace(/\\n/g, "\n");
  if (document.fieldValues) {
    Object.keys(document.fieldValues).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      text = text.replace(regex, document.fieldValues[key] ?? "");
    });
  }
  // Clear remaining vars but keep {{STAMP}}
  text = text.replace(/\{\{(?!STAMP\}\})[^}]+\}\}/g, "");

  const completedApprovals = (document.approvals || []).filter(
    (a: any) => a.status !== "PENDING"
  );

  // Split content by {{STAMP}} for inline rendering
  const textParts = text.split("{{STAMP}}");
  const hasInlineStamps = textParts.length > 1; // true if template has {{STAMP}} tags

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { margin: 20mm; size: A4; }
        }
        body { font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; }
      `}</style>

      {/* Print controls — hidden on print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-700"
        >
          Печать / Сохранить PDF
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Закрыть
        </button>
      </div>

      <div className="max-w-[800px] mx-auto px-12 py-12 bg-white min-h-screen">
        {/* Document header */}
        <div className="text-center mb-8">
          <p className="text-[11px] text-zinc-500 mb-1">{document.number}</p>
          <h1 className="text-[20px] font-bold text-zinc-900 leading-snug">
            {document.title}
          </h1>
          <p className="mt-1 text-[12px] text-zinc-500">
            Инициатор: {document.initiator?.name} &nbsp;·&nbsp;{" "}
            {new Date(document.createdAt).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <hr className="border-zinc-300 mb-6" />

        {/* Field values */}
        {document.template?.fields && document.template.fields.length > 0 && (
          <div className="mb-6">
            <table className="w-full border-collapse text-[12px]">
              <tbody>
                {document.template.fields.map((field: any) => (
                  <tr key={field.key} className="border-b border-zinc-200">
                    <td className="py-1.5 pr-4 font-semibold text-zinc-600 w-[35%]">{field.label}</td>
                    <td className="py-1.5 text-zinc-800">{document.fieldValues?.[field.key] || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Document content with inline stamps */}
        {text && (
          <div className="mb-8">
            {textParts.map((part: string, i: number) => (
              <span key={i}>
                <pre className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed text-zinc-800">
                  {part}
                </pre>
                {i < textParts.length - 1 && (
                  completedApprovals[i] ? (
                    <table className="border-collapse my-4" style={{ fontFamily: "'Times New Roman', serif" }}>
                      <tbody>
                        <tr>
                          <td style={{ border: "1px solid #333", padding: "10px 14px", fontSize: "12px", lineHeight: "1.8", minWidth: "260px" }}>
                            <strong>Документ подписан электронной подписью</strong><br />
                            Владелец: {completedApprovals[i].approver?.name || "—"}<br />
                            Должность: {completedApprovals[i].approver?.position?.name || completedApprovals[i].approver?.department || "—"}<br />
                            Дата подписи: {completedApprovals[i].decidedAt ? new Date(completedApprovals[i].decidedAt).toLocaleDateString("ru-RU") : "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <table className="border-collapse my-4" style={{ fontFamily: "'Times New Roman', serif", opacity: 0.5 }}>
                      <tbody>
                        <tr>
                          <td style={{ border: "1px dashed #999", padding: "10px 14px", fontSize: "12px", lineHeight: "1.8", minWidth: "260px", color: "#999" }}>
                            <strong>Документ подписан электронной подписью</strong><br />
                            Владелец: _______________<br />
                            Должность: _______________<br />
                            Дата подписи: _______________
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )
                )}
              </span>
            ))}
          </div>
        )}

        {/* Approval stamps — только если в шаблоне нет inline {{STAMP}} */}
        {completedApprovals.length > 0 && !hasInlineStamps && (
          <>
            <hr className="border-zinc-300 my-6" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Подписи согласования
              </p>
              <table className="border-collapse w-full" style={{ fontFamily: "'Times New Roman', serif" }}>
                <tbody>
                  <tr>
                    {completedApprovals.map((a: any, idx: number) => (
                      <td key={idx} style={{ border: "1px solid #333", padding: "10px 14px", fontSize: "12px", lineHeight: "1.8", verticalAlign: "top", width: `${100 / completedApprovals.length}%` }}>
                        <strong>{a.status === "APPROVED" ? "Документ подписан электронной подписью" : "Отклонено"}</strong>
                        {a.stepNumber ? <><br /><span style={{ fontSize: "10px", color: "#666" }}>Этап {a.stepNumber}</span></> : null}<br />
                        Владелец: {a.approver?.name || "—"}<br />
                        Должность: {a.approver?.position?.name || a.approver?.department || "—"}<br />
                        Дата подписи: {a.decidedAt ? new Date(a.decidedAt).toLocaleDateString("ru-RU") : "—"}
                        {a.comment ? <><br /><em style={{ fontSize: "11px", color: "#555" }}>«{a.comment}»</em></> : null}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {document.status === "APPROVED" && (
                <div className="mt-4 border-2 border-zinc-900 rounded p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Документ согласован и утверждён
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {new Date(document.updatedAt || document.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
