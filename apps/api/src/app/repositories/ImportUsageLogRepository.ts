import { prisma } from '../../config/database';

export class ImportUsageLogRepository {
  /**
   * Sum all businesses imported for an org within the given billing cycle.
   * cycleStart is treated as an exact key — all log entries for the same
   * cycle share the same cycleStart value (stored at import time).
   */
  async sumSinceCycleStart(orgId: string, cycleStart: Date): Promise<number> {
    const result = await (prisma as any).importUsageLog.aggregate({
      where: { orgId, cycleStart: cycleStart.toISOString() },
      _sum:  { count: true },
    });
    return result._sum?.count ?? 0;
  }

  /** Record businesses imported. Called after a successful import (never rolled back on batch delete). */
  async create(orgId: string, count: number, cycleStart: Date): Promise<void> {
    if (count <= 0) return;
    await (prisma as any).importUsageLog.create({
      data: {
        orgId,
        count,
        cycleStart: cycleStart.toISOString(),
      },
    });
  }
}

export const importUsageLogRepository = new ImportUsageLogRepository();
