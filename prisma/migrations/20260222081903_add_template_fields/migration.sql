-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fieldValues" JSONB;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "content" TEXT,
ADD COLUMN     "fields" JSONB;
