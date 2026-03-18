import { prisma } from '../../config/database';
import { businessRepository } from '../repositories/BusinessRepository';
import { importRepository } from '../repositories/ImportRepository';
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
  async importFromMaps(orgId: string, businesses: RawBusiness[], planTier: string) {
    await this.assertImportLimit(orgId, planTier);
    await this.assertBusinessLimit(orgId, businesses.length, planTier);
    return this.processImport(orgId, businesses, 'google_maps');
  }

  async importFromExcel(orgId: string, businesses: RawBusiness[], planTier: string) {
    await this.assertImportLimit(orgId, planTier);
    await this.assertBusinessLimit(orgId, businesses.length, planTier);
    return this.processImport(orgId, businesses, 'excel');
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
      toAdd.push({
        ...biz,
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

  private async assertImportLimit(orgId: string, planTier: string): Promise<void> {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    if (!limits || limits.maxImportsPerMonth === -1) return;

    const count = await importRepository.countThisMonth(orgId, startOfMonth(new Date()));
    if (count >= limits.maxImportsPerMonth) {
      throw new PlanLimitError(
        'IMPORT_LIMIT_EXCEEDED',
        `You've reached your monthly import limit of ${limits.maxImportsPerMonth}. Upgrade to import more.`,
      );
    }
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
