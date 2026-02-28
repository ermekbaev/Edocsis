-- Fix missing description columns on Railway
ALTER TABLE "ApprovalRoute" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "ApprovalRouteStep" ADD COLUMN IF NOT EXISTS "description" TEXT;
