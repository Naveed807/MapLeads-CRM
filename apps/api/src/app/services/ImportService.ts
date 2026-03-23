import { prisma } from '../../config/database';
import { businessRepository } from '../repositories/BusinessRepository';
import { importRepository } from '../repositories/ImportRepository';
import { importUsageLogRepository } from '../repositories/ImportUsageLogRepository';
import { PLAN_LIMITS } from '../../config/plans';
import { PlanLimitError, AppError } from '../errors/AppError';
import { startOfMonth } from '../../utils/date';

interface RawBusiness {
  name:     string;
  category?: string;
  phone?:   string;
  email?:   string;
  address?: string;
  website?: string;
  mapsUrl?: string;
  rating?:  string;
  reviews?: string;
  hours?:   string;
}

export class ImportService {
  async importFromMaps(orgId: string, businesses: RawBusiness[], planTier: string, periodStart?: Date) {
    const cycleStart = this.computeCycleStart(planTier, periodStart);
    await this.assertImportCycleLimit(orgId, planTier, cycleStart, businesses.length);
    await this.assertBusinessLimit(orgId, businesses.length, planTier);
    const result = await this.processImport(orgId, businesses, 'google_maps');
    await importUsageLogRepository.create(orgId, result.added, cycleStart);
    return result;
  }

  async importFromExcel(orgId: string, businesses: RawBusiness[], planTier: string, periodStart?: Date) {
    const cycleStart = this.computeCycleStart(planTier, periodStart);
    await this.assertImportCycleLimit(orgId, planTier, cycleStart, businesses.length);
    await this.assertBusinessLimit(orgId, businesses.length, planTier);
    const result = await this.processImport(orgId, businesses, 'excel');
    await importUsageLogRepository.create(orgId, result.added, cycleStart);
    return result;
  }

  async getHistory(orgId: string) {
    return importRepository.findByOrg(orgId);
  }

  async deleteBatch(batchId: string, orgId: string) {
    const batch = await importRepository.findById(batchId);
    if (!batch || (batch as any).orgId !== orgId) {
      throw new AppError(404, 'NOT_FOUND', 'Import batch not found');
    }
    await importRepository.deleteWithBusinesses(batchId, orgId);
    await businessRepository.invalidateOrgCache(orgId);
  }

  /**
   * Returns current-cycle usage stats for the UI.
   * cycleStart / limit depends on plan tier and subscription period.
   */
  async getUsage(orgId: string, planTier: string, periodStart?: Date) {
    const limits     = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    const cycleStart = this.computeCycleStart(planTier, periodStart);
    const limit      = limits?.maxImportsPerCycle ?? 100;

    if (limit === -1) {
      return { used: 0, limit: -1, remaining: -1, cycleStart, planTier };
    }

    const used      = await importUsageLogRepository.sumSinceCycleStart(orgId, cycleStart);
    const remaining = Math.max(0, limit - used);
    return { used, limit, remaining, cycleStart, planTier };
  }

  private async processImport(orgId: string, businesses: RawBusiness[], source: string) {
    const existing = await prisma.business.findMany({
      where:  { orgId },
      select: { name: true, phone: true, email: true },
    });

    const existingSet = new Set(
      existing.map((b: any) => `${b.name}|${b.phone || ''}|${b.email || ''}`),
    );

    const toAdd: any[] = [];
    let skipped = 0;

    // Create batch record
    const batch = await importRepository.create({
      source,
      totalCount:   businesses.length,
      addedCount:   0,
      skippedCount: 0,
      org:          { connect: { id: orgId } },
    });

    for (const biz of businesses) {
      const key = `${biz.name}|${biz.phone || ''}|${biz.email || ''}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }
      existingSet.add(key);
      // Only pass fields that exist on the Business model — strip any
      // extra keys the frontend may include (e.g. id, notes, status).
      toAdd.push({
        name:          biz.name,
        category:      biz.category  || null,
        phone:         biz.phone     || null,
        email:         biz.email     || null,
        address:       biz.address   || null,
        website:       biz.website   || null,
        mapsUrl:       biz.mapsUrl   || null,
        rating:        biz.rating    || null,
        reviews:       biz.reviews   || null,
        hours:         biz.hours     || null,
        orgId,
        importBatchId: batch.id,
        importedAt:    new Date(),
      });
    }

    if (toAdd.length) {
      await prisma.business.createMany({ data: toAdd, skipDuplicates: true });
    }

    // Update batch counts
    await prisma.importBatch.update({
      where: { id: batch.id },
      data:  { addedCount: toAdd.length, skippedCount: skipped },
    });

    await businessRepository.invalidateOrgCache(orgId);

    return { added: toAdd.length, skipped, batchId: batch.id };
  }

  /**
   * Billing cycle start:
   *  - BASIC      → first day of the current calendar month
   *  - FREELANCER → subscription period start (rolling date)
   *  - AGENCY     → not relevant (unlimited), but returns period start if provided
   */
  private computeCycleStart(planTier: string, periodStart?: Date): Date {
    if (planTier === 'BASIC' || !periodStart) {
      return startOfMonth(new Date());
    }
    // Normalise to midnight UTC to ensure consistent key matching
    const d = new Date(periodStart);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Throws IMPORT_LIMIT_EXCEEDED if the org has consumed (or would exceed)
   * its businesses-per-cycle quota.  Deletion of batches/businesses does NOT
   * reduce the counter — limits are based on ImportUsageLog which is append-only.
   */
  private async assertImportCycleLimit(
    orgId: string,
    planTier: string,
    cycleStart: Date,
    incomingCount: number,
  ): Promise<void> {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    if (!limits || limits.maxImportsPerCycle === -1) return; // unlimited

    const used      = await importUsageLogRepository.sumSinceCycleStart(orgId, cycleStart);
    const limit     = limits.maxImportsPerCycle;
    const remaining = limit - used;

    if (remaining <= 0) {
      throw new PlanLimitError(
        'IMPORT_LIMIT_EXCEEDED',
        `Your ${planTier} plan allows ${limit} businesses per billing cycle and you have used all ${used}. ` +
        `Upgrade your plan to import more.`,
      );
    }

    if (incomingCount > remaining) {
      throw new PlanLimitError(
        'IMPORT_LIMIT_EXCEEDED',
        `This import contains ${incomingCount} businesses but only ${remaining} import slot${remaining !== 1 ? 's' : ''} ` +
        `remain this cycle (${used}/${limit} used). Reduce the import size or upgrade your plan.`,
      );
    }
  }

  private async assertImportLimit(orgId: string, planTier: string): Promise<void> {
    // Legacy stub kept to avoid unused-import errors — new code uses assertImportCycleLimit
  }

  private async assertBusinessLimit(orgId: string, incomingCount: number, planTier: string): Promise<void> {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    if (!limits || limits.maxBusinesses === -1) return;

    const current = await businessRepository.countByOrg(orgId);
    if (current >= limits.maxBusinesses) {
      throw new PlanLimitError(
        'BUSINESS_LIMIT_EXCEEDED',
        `You've reached your business limit of ${limits.maxBusinesses}. Upgrade to add more.`,
      );
    }
  }
}

export const importService = new ImportService();
