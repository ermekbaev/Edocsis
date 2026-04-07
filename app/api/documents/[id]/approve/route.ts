import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApprovalStamp, saveStampToDisk } from "@/lib/generate-stamp";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let comment: string | undefined;
  try {
    const body = await req.json();
    comment = body.comment;
  } catch {
    // No body — fine, comment is optional
  }

  // Load document with approval route
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      template: {
        include: {
          approvalRoute: {
            include: {
              steps: { orderBy: { stepNumber: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status !== "IN_APPROVAL") {
    return NextResponse.json(
      { error: "Document is not in approval" },
      { status: 400 }
    );
  }

  // Find this user's pending approval record for the current step
  const myApproval = await prisma.approval.findFirst({
    where: {
      documentId: id,
      approverId: auth.userId,
      status: "PENDING",
      stepNumber: document.currentStepNumber ?? undefined,
    },
  });

  if (!myApproval) {
    return NextResponse.json(
      { error: "You are not an approver for this document at the current step" },
      { status: 403 }
    );
  }

  // Mark this approval as APPROVED
  await prisma.approval.update({
    where: { id: myApproval.id },
    data: {
      status: "APPROVED",
      comment: comment || null,
      decidedAt: new Date(),
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: "approved",
      documentId: id,
      userId: auth.userId,
      metadata: { comment, stepNumber: document.currentStepNumber },
    },
  });

  // --- Determine if this step is complete ---
  const isMultiStep = document.currentStepNumber !== null;

  if (isMultiStep) {
    const approvalRoute = document.template?.approvalRoute ?? null;
    const currentStep = approvalRoute?.steps.find(
      (s) => s.stepNumber === document.currentStepNumber
    );

    if (!currentStep) {
      return NextResponse.json(
        { error: "Current step not found in approval route" },
        { status: 500 }
      );
    }

    const requireAll = currentStep.requireAll;

    // Get all approval records for this step
    const stepApprovals = await prisma.approval.findMany({
      where: {
        documentId: id,
        stepNumber: document.currentStepNumber ?? undefined,
      },
    });

    const allApproved = stepApprovals.every((a) => a.status === "APPROVED");
    const anyApproved = stepApprovals.some((a) => a.status === "APPROVED");

    const stepComplete = requireAll ? allApproved : anyApproved;

    if (!stepComplete) {
      // Step not yet complete — just return updated document
      const updatedDocument = await prisma.document.findUnique({
        where: { id },
        include: {
          template: true,
          initiator: { select: { name: true } },
          currentApprover: { select: { name: true } },
        },
      });
      return NextResponse.json(updatedDocument);
    }

    // Step is complete — find next step
    const nextStep = approvalRoute?.steps.find(
      (s) => s.stepNumber > (document.currentStepNumber ?? 0)
    );

    if (nextStep) {
      // Advance to next step
      const nextApproverIds = nextStep.approverIds as string[];
      const nextApproverRole = nextStep.approverRole as string | null;

      let nextApprovers;
      if (nextApproverRole) {
        // Role-based: position ID from справочник
        nextApprovers = await prisma.user.findMany({
          where: { positionId: nextApproverRole },
        });
        if (nextApprovers.length === 0) {
          return NextResponse.json(
            { error: "No users found with the configured role for next step" },
            { status: 500 }
          );
        }
      } else {
        nextApprovers = await prisma.user.findMany({
          where: { id: { in: nextApproverIds } },
        });
        if (nextApprovers.length === 0) {
          return NextResponse.json(
            { error: "No valid approvers found for next step" },
            { status: 500 }
          );
        }
      }

      const approvalCreates = nextApprovers.map((approver) => ({
        documentId: id,
        approverId: approver.id,
        status: "PENDING" as const,
        stepNumber: nextStep.stepNumber,
      }));

      const notificationCreates = nextApprovers.map((approver) => ({
        type: "APPROVAL_REQUEST",
        message: `Document "${document.title}" (${document.number}) is waiting for your approval (Step ${nextStep.stepNumber}: ${nextStep.name})`,
        userId: approver.id,
      }));

      const [updatedDocument] = await prisma.$transaction([
        prisma.document.update({
          where: { id },
          data: {
            currentApproverId: nextApprovers[0].id,
            currentStepNumber: nextStep.stepNumber,
          },
          include: {
            template: true,
            initiator: { select: { name: true } },
            currentApprover: { select: { name: true } },
          },
        }),
        ...approvalCreates.map((data) => prisma.approval.create({ data })),
        ...notificationCreates.map((data) =>
          prisma.notification.create({ data })
        ),
      ]);

      return NextResponse.json(updatedDocument);
    } else {
      // No next step — document fully approved
      const updatedDocument = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id },
          data: {
            status: "APPROVED",
            currentApproverId: null,
            currentStepNumber: null,
          },
          include: {
            template: true,
            initiator: { select: { name: true } },
            currentApprover: { select: { name: true } },
          },
        });

        // Notify initiator
        await tx.notification.create({
          data: {
            type: "DOCUMENT_APPROVED",
            message: `Ваш документ "${document.title}" (${document.number}) согласован`,
            userId: document.initiatorId,
          },
        });

        await tx.auditLog.create({
          data: {
            action: "fully_approved",
            documentId: id,
            userId: auth.userId,
            metadata: {},
          },
        });

        return doc;
      });

      // Generate approval stamp PDF
      await attachApprovalStamp({ documentId: id, approverId: auth.userId, document });
      // Regenerate .doc file with filled stamps
      await regenerateDocWithStamps(id);

      return NextResponse.json(updatedDocument);
    }
  } else {
    // Single-step (no approval route) — immediately approve document
    const updatedDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id },
        data: {
          status: "APPROVED",
          currentApproverId: null,
          currentStepNumber: null,
        },
        include: {
          template: true,
          initiator: { select: { name: true } },
          currentApprover: { select: { name: true } },
        },
      });

      await tx.notification.create({
        data: {
          type: "DOCUMENT_APPROVED",
          message: `Ваш документ "${document.title}" (${document.number}) согласован`,
          userId: document.initiatorId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "fully_approved",
          documentId: id,
          userId: auth.userId,
          metadata: {},
        },
      });

      return doc;
    });

    // Generate approval stamp PDF
    await attachApprovalStamp({ documentId: id, approverId: auth.userId, document });
    // Regenerate .doc file with filled stamps
    await regenerateDocWithStamps(id);

    return NextResponse.json(updatedDocument);
  }
}

/** После финального согласования пересоздаёт .doc файл с заполненными штампами */
async function regenerateDocWithStamps(documentId: string) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        template: { select: { content: true, fields: true } },
        initiator: { select: { name: true } },
        approvals: {
          where: { status: { not: "PENDING" } },
          orderBy: [{ stepNumber: "asc" }, { decidedAt: "asc" }],
          include: {
            approver: { select: { name: true, position: { select: { name: true } }, department: true } },
          },
        },
        files: {
          where: { mimeType: "application/msword" },
          select: { id: true, path: true },
        },
      },
    });

    if (!doc) return;

    let text = doc.template?.content || "";
    text = text.replace(/\\n/g, "\n");

    const fieldValues = (doc.fieldValues as Record<string, string>) || {};
    Object.keys(fieldValues).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      text = text.replace(regex, fieldValues[key] ?? "");
    });

    // Replace each {{STAMP}} with the corresponding approval's data
    let approvalIdx = 0;
    text = text.replace(/\{\{STAMP\}\}/g, () => {
      const a = doc.approvals[approvalIdx++];
      if (!a) {
        return `<table style="border-collapse:collapse;margin:16px 0"><tr><td style="border:1px dashed #999;padding:10px 14px;font-family:'Times New Roman',serif;font-size:12px;line-height:1.7;color:#999"><strong>Документ подписан электронной подписью</strong><br>Владелец: _______________<br>Должность: _______________<br>Дата подписи: _______________</td></tr></table>`;
      }
      const name = a.approver?.name || "—";
      const pos = (a.approver as any)?.position?.name || (a.approver as any)?.department || "—";
      const date = a.decidedAt ? new Date(a.decidedAt).toLocaleDateString("ru-RU") : "—";
      return `<table style="border-collapse:collapse;margin:16px 0"><tr><td style="border:1px solid #444;padding:10px 14px;font-family:'Times New Roman',serif;font-size:12px;line-height:1.7"><strong>Документ подписан электронной подписью</strong><br>Владелец: ${name}<br>Должность: ${pos}<br>Дата подписи: ${date}</td></tr></table>`;
    });

    text = text.replace(/\{\{[^}]+\}\}/g, "");

    const fields: any[] = Array.isArray(doc.template?.fields) ? doc.template!.fields : [];
    const fieldsTable = fields.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px">
          ${fields.map((f: any) => `<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:6px 12px 6px 0;font-weight:600;color:#6b7280;width:35%">${f.label}</td><td style="padding:6px 0;color:#111827">${fieldValues[f.key] || "—"}</td></tr>`).join("")}
         </table>`
      : "";

    // Approval table at the end (if no inline {{STAMP}})
    const hasInlineStamps = (doc.template?.content || "").includes("{{STAMP}}");
    const stampsSection = !hasInlineStamps && doc.approvals.length > 0
      ? `<hr style="margin:24px 0"/><p style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#666">Подписи согласования</p>
         <table style="width:100%;border-collapse:collapse;margin-top:12px"><tr>
           ${doc.approvals.map((a: any) => {
             const name = a.approver?.name || "—";
             const pos = a.approver?.position?.name || a.approver?.department || "—";
             const date = a.decidedAt ? new Date(a.decidedAt).toLocaleDateString("ru-RU") : "—";
             return `<td style="border:2px solid #333;padding:10px;width:${100 / doc.approvals.length}%;vertical-align:top;font-size:12px;line-height:1.7"><strong>${a.status === "APPROVED" ? "Документ подписан электронной подписью" : "Отклонено"}</strong><br>Владелец: ${name}<br>Должность: ${pos}<br>Дата подписи: ${date}</td>`;
           }).join("")}
         </tr></table>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><title>${doc.title}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 30mm 25mm; color: #000; }
  h1 { font-size: 16px; text-align: center; font-weight: bold; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #6b7280; text-align: center; margin-bottom: 20px; }
  hr { border: none; border-top: 1px solid #d1d5db; margin: 16px 0; }
  pre { font-family: 'Times New Roman', serif; font-size: 13px; white-space: pre-wrap; line-height: 1.7; }
  .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: center; }
</style></head>
<body>
  <h1>${doc.title}</h1>
  <div class="meta">${doc.number} &nbsp;·&nbsp; Инициатор: ${doc.initiator?.name || "—"} &nbsp;·&nbsp; ${new Date(doc.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}</div>
  <hr/>
  ${fieldsTable}
  <pre>${text}</pre>
  ${stampsSection}
  <div class="footer">Документ согласован</div>
</body></html>`;

    const htmlBuffer = Buffer.from(html, "utf-8");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = doc.title.replace(/[^а-яёa-z0-9\s]/gi, "").trim().replace(/\s+/g, "_") || "document";
    const fileName = `${timestamp}-${safeName}.doc`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, htmlBuffer);

    // Delete old .doc files from disk and DB
    for (const oldFile of doc.files) {
      try {
        await unlink(path.join(process.cwd(), "public", oldFile.path));
      } catch { /* file may not exist on disk */ }
      await prisma.file.delete({ where: { id: oldFile.id } });
    }

    // Create new file record
    await prisma.file.create({
      data: {
        name: `${doc.title}.doc`,
        path: `/uploads/${fileName}`,
        size: htmlBuffer.length,
        mimeType: "application/msword",
        documentId,
        userId: doc.initiatorId,
      },
    });
  } catch (err) {
    console.error("[DOC_REGEN] Failed to regenerate doc with stamps:", err);
  }
}

/** Генерирует штамп согласования и сохраняет его как файл документа */
async function attachApprovalStamp({
  documentId,
  approverId,
  document,
}: {
  documentId: string;
  approverId: string;
  document: { title: string; number: string };
}) {
  try {
    // Загружаем данные согласующего
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: {
        id: true,
        name: true,
        role: true,
        position: { select: { name: true } },
      },
    });

    if (!approver) return;

    const roleLabels: Record<string, string> = {
      ADMIN: "Администратор",
      USER: "Пользователь",
      APPROVER: "Согласующий",
      INITIATOR: "Инициатор",
    };

    const position =
      approver.position?.name ?? roleLabels[approver.role] ?? approver.role;

    const stampBuffer = await generateApprovalStamp({
      approverName: approver.name,
      position,
      date: new Date(),
      documentTitle: document.title,
      documentNumber: document.number,
    });

    const { webPath, fileName } = await saveStampToDisk(documentId, stampBuffer);

    // Создаём запись файла в БД
    await prisma.file.create({
      data: {
        name: `Штамп согласования — ${document.number}.pdf`,
        path: webPath,
        size: stampBuffer.length,
        mimeType: "application/pdf",
        documentId,
        userId: approverId,
      },
    });
  } catch (err) {
    // Не прерываем основной поток — штамп опционален
    console.error("[STAMP] Failed to generate approval stamp:", err);
  }
}
