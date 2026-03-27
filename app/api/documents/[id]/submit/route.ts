import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Parse optional approverId from request body
  let manualApproverId: string | undefined;
  try {
    const body = await req.json();
    manualApproverId = body.approverId;
  } catch {
    // No body or invalid JSON - that's fine, approverId is optional
  }

  try {

  // Find document with template and approval route
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      initiator: { select: { name: true } },
      template: {
        include: {
          approvalRoute: {
            include: {
              steps: {
                orderBy: {
                  stepNumber: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify ownership
  if (document.initiatorId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify status
  if (document.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT documents can be submitted" },
      { status: 400 }
    );
  }

  // Check if template has approval route
  const approvalRoute = document.template?.approvalRoute ?? null;
  if (!approvalRoute || approvalRoute.steps.length === 0) {
    // Use manually selected approver if provided
    let approver;

    if (manualApproverId) {
      approver = await prisma.user.findUnique({
        where: { id: manualApproverId },
      });

      if (!approver) {
        return NextResponse.json(
          { error: "Selected approver not found" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Укажите согласующего" },
        { status: 400 }
      );
    }

    // Update document, create approval, log action, and notify approver
    const [updatedDocument] = await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: {
          status: "IN_APPROVAL",
          currentApproverId: approver.id,
          currentStepNumber: null,
        },
      }),
      prisma.approval.create({
        data: {
          documentId: id,
          approverId: approver.id,
          status: "PENDING",
          stepNumber: undefined,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "submitted",
          documentId: id,
          userId: auth.userId,
          metadata: { approverId: approver.id, approverName: approver.name },
        },
      }),
      prisma.notification.create({
        data: {
          type: "APPROVAL_REQUEST",
          message: `New document "${document.title}" (${document.number}) is waiting for your approval`,
          userId: approver.id,
        },
      }),
    ]);

    await generateDocumentFile(id, auth.userId, document as any);
    return NextResponse.json(updatedDocument);
  }

  // Multi-step approval route exists
  const firstStep = approvalRoute.steps[0];
  const approverIds = firstStep.approverIds as string[];
  const approverRole = firstStep.approverRole as string | null;

  // Get all approvers for the first step:
  // - If approverRole is set → find all users with that position (from справочник)
  // - Otherwise → find specific users by approverIds
  let approvers;
  if (approverRole) {
    approvers = await prisma.user.findMany({
      where: { positionId: approverRole },
    });
    if (approvers.length === 0) {
      return NextResponse.json(
        { error: `Нет пользователей с ролью для первого этапа` },
        { status: 400 }
      );
    }
  } else {
    if (!approverIds || approverIds.length === 0) {
      return NextResponse.json(
        { error: "No approvers configured for first step" },
        { status: 400 }
      );
    }
    approvers = await prisma.user.findMany({
      where: {
        id: { in: approverIds },
      },
    });
  }

  if (approvers.length === 0) {
    return NextResponse.json(
      { error: "No valid approvers found for first step" },
      { status: 400 }
    );
  }

  // Select first approver as current approver (for display purposes)
  const currentApprover = approvers[0];

  // Create approval records for all approvers in this step
  const approvalCreates = approvers.map((approver) => ({
    documentId: id,
    approverId: approver.id,
    status: "PENDING" as const,
    stepNumber: firstStep.stepNumber,
  }));

  // Create notifications for all approvers
  const notificationCreates = approvers.map((approver) => ({
    type: "APPROVAL_REQUEST",
    message: `New document "${document.title}" (${document.number}) is waiting for your approval (Step ${firstStep.stepNumber}: ${firstStep.name})`,
    userId: approver.id,
  }));

  // Update document and create all approvals/notifications in transaction
  const [updatedDocument] = await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: {
        status: "IN_APPROVAL",
        currentApproverId: currentApprover.id,
        currentStepNumber: firstStep.stepNumber,
      },
    }),
    ...approvalCreates.map((data) => prisma.approval.create({ data })),
    prisma.auditLog.create({
      data: {
        action: "submitted",
        documentId: id,
        userId: auth.userId,
        metadata: {
          stepNumber: firstStep.stepNumber,
          stepName: firstStep.name,
          approverCount: approvers.length,
        },
      },
    }),
    ...notificationCreates.map((data) => prisma.notification.create({ data })),
  ]);

  await generateDocumentFile(id, auth.userId, document as any);
  return NextResponse.json(updatedDocument);

  } catch (error: any) {
    console.error("Submit route error:", error);
    return NextResponse.json({ error: "Failed to submit document", detail: error?.message }, { status: 500 });
  }
}

// ─── Auto-generate document file on submit ────────────────────────────────────

async function generateDocumentFile(
  documentId: string,
  userId: string,
  doc: {
    title: string;
    number: string;
    initiator?: { name: string } | null;
    createdAt: Date;
    fieldValues: any;
    template?: {
      content?: string | null;
      fields?: any;
    } | null;
  }
) {
  try {
    let text = doc.template?.content || "";
    text = text.replace(/\\n/g, "\n");

    const fieldValues = (doc.fieldValues as Record<string, string>) || {};
    Object.keys(fieldValues).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      text = text.replace(regex, fieldValues[key] ?? "");
    });
    // Replace {{STAMP}} with an HTML stamp placeholder (approvals not yet done at submit time)
    const stampHtml = `<table style="border-collapse:collapse;margin:16px 0"><tr><td style="border:1px solid #444;padding:10px 14px;font-family:'Times New Roman',serif;font-size:12px;line-height:1.7"><strong>Документ подписан электронной подписью</strong><br>Владелец: _______________<br>Должность: _______________<br>Дата подписи: _______________</td></tr></table>`;
    text = text.replace(/\{\{STAMP\}\}/g, stampHtml);
    text = text.replace(/\{\{[^}]+\}\}/g, "");

    const fields: any[] = Array.isArray(doc.template?.fields) ? doc.template!.fields : [];

    const fieldsTable = fields.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px">
          ${fields.map((f: any) => `
            <tr style="border-bottom:1px solid #e5e7eb">
              <td style="padding:6px 12px 6px 0;font-weight:600;color:#6b7280;width:35%">${f.label}</td>
              <td style="padding:6px 0;color:#111827">${fieldValues[f.key] || "—"}</td>
            </tr>`).join("")}
         </table>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${doc.title}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 30mm 25mm; color: #000; }
  h1 { font-size: 16px; text-align: center; font-weight: bold; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #6b7280; text-align: center; margin-bottom: 20px; }
  hr { border: none; border-top: 1px solid #d1d5db; margin: 16px 0; }
  pre { font-family: 'Times New Roman', serif; font-size: 13px; white-space: pre-wrap; line-height: 1.7; }
  .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>${doc.title}</h1>
  <div class="meta">
    ${doc.number} &nbsp;·&nbsp; Инициатор: ${doc.initiator?.name || "—"} &nbsp;·&nbsp;
    ${new Date(doc.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
  </div>
  <hr/>
  ${fieldsTable}
  <pre>${text}</pre>
  <div class="footer">Документ сформирован автоматически при запуске в документооборот</div>
</body>
</html>`;

    const htmlBuffer = Buffer.from(html, "utf-8");
    const timestamp = Date.now();
    const safeName = doc.title.replace(/[^а-яёa-z0-9\s]/gi, "").trim().replace(/\s+/g, "_") || "document";
    const fileName = `${timestamp}-${safeName}.doc`;
    const filePath = path.join(process.cwd(), "public", "uploads", fileName);

    await writeFile(filePath, htmlBuffer);

    await prisma.file.create({
      data: {
        name: `${doc.title}.doc`,
        path: `/uploads/${fileName}`,
        size: htmlBuffer.length,
        mimeType: "application/msword",
        documentId,
        userId,
      },
    });
  } catch (err) {
    // Non-critical: log but don't fail the submission
    console.error("Failed to auto-generate document file:", err);
  }
}
