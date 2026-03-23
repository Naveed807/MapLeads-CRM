-- CreateTable
CREATE TABLE "ImportUsageLog" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "ImportUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportUsageLog_orgId_cycleStart_idx" ON "ImportUsageLog"("orgId", "cycleStart");

-- AddForeignKey
ALTER TABLE "ImportUsageLog" ADD CONSTRAINT "ImportUsageLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
