/*
  Warnings:

  - A unique constraint covering the columns `[documentId,approverId]` on the table `Approval` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Approval_documentId_approverId_key" ON "Approval"("documentId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_number_key" ON "Document"("number");
