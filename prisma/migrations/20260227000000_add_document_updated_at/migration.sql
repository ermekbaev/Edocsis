-- Add updatedAt to Document table
ALTER TABLE "Document" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
