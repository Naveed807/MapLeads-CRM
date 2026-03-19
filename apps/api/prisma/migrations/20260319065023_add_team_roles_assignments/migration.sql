-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrgRole" ADD VALUE 'MANAGER';
ALTER TYPE "OrgRole" ADD VALUE 'TEAM_LEAD';
ALTER TYPE "OrgRole" ADD VALUE 'SALES_REP';

-- CreateTable
CREATE TABLE "BusinessAssignment" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "bizId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "BusinessAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessAssignment_memberId_idx" ON "BusinessAssignment"("memberId");

-- CreateIndex
CREATE INDEX "BusinessAssignment_bizId_idx" ON "BusinessAssignment"("bizId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAssignment_bizId_memberId_key" ON "BusinessAssignment"("bizId", "memberId");

-- AddForeignKey
ALTER TABLE "BusinessAssignment" ADD CONSTRAINT "BusinessAssignment_bizId_fkey" FOREIGN KEY ("bizId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAssignment" ADD CONSTRAINT "BusinessAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "OrgMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
