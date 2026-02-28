-- Make templateId optional in Document table
ALTER TABLE "Document" ALTER COLUMN "templateId" DROP NOT NULL;
