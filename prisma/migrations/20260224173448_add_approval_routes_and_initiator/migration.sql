-- Add INITIATOR to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'INITIATOR';

-- CreateTable
CREATE TABLE "ApprovalRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRouteStep" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "approverIds" JSONB NOT NULL,
    "requireAll" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApprovalRouteStep_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN "stepNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "currentStepNumber" INTEGER;

-- Drop old unique constraint on Approval
ALTER TABLE "Approval" DROP CONSTRAINT IF EXISTS "Approval_documentId_approverId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRoute_templateId_key" ON "ApprovalRoute"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRouteStep_routeId_stepNumber_key" ON "ApprovalRouteStep"("routeId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_documentId_approverId_stepNumber_key" ON "Approval"("documentId", "approverId", "stepNumber");

-- AddForeignKey
ALTER TABLE "ApprovalRoute" ADD CONSTRAINT "ApprovalRoute_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRouteStep" ADD CONSTRAINT "ApprovalRouteStep_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "ApprovalRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
