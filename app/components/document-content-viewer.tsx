"use client";

import { renderTemplate } from "@/lib/template-renderer";

interface DocumentContentViewerProps {
  template: {
    name: string;
    content: string | null;
    fields: any;
  };
  fieldValues: Record<string, any> | null;
}

export function DocumentContentViewer({
  template,
  fieldValues,
}: DocumentContentViewerProps) {
  // If template has no content, show message
  if (!template.content) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">
          Содержимое документа
        </h3>
        <div className="rounded-lg bg-zinc-50 px-4 py-8 text-center">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-[13px] text-zinc-500">
            У этого шаблона нет содержимого.
          </p>
          <p className="text-[12px] text-zinc-400 mt-1">
            К документу можно прикрепить файлы и комментарии.
          </p>
        </div>
      </div>
    );
  }

  // Render template with field values
  const renderedContent = renderTemplate(template.content, fieldValues);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h3 className="text-[15px] font-semibold text-zinc-900">
          Содержимое документа
        </h3>
        <p className="text-[12px] text-zinc-500 mt-0.5">
          Сгенерировано из шаблона: {template.name}
        </p>
      </div>

      <div className="p-6">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-[13px] text-zinc-800 leading-relaxed">
            {renderedContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
