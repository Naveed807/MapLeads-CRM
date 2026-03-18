import { prisma } from '../../config/database';
import { BaseRepository } from './BaseRepository';

type ImportBatch = Awaited<ReturnType<typeof prisma.importBatch.findUniqueOrThrow>>;


export class ImportRepository extends BaseRepository<ImportBatch> {
  protected model = prisma.importBatch;

  async create(data: Record<string, any>): Promise<ImportBatch> {
    return prisma.importBatch.create({ data: data as any });
  }

  async findByOrg(orgId: string) {
    return prisma.importBatch.findMany({
      where:   { orgId },
      orderBy: { importedAt: 'desc' },
      take:    50,
    });
  }

  async countThisMonth(orgId: string, monthStart: Date): Promise<number> {
    return prisma.importBatch.count({
      where: { orgId, importedAt: { gte: monthStart } },
    });
  }

  async deleteWithBusinesses(id: string, orgId: string): Promise<void> {
    await prisma.$transaction([
      prisma.business.deleteMany({ where: { importBatchId: id, orgId } }),
      prisma.importBatch.delete({ where: { id } }),
    ]);
  }
}

export const importRepository = new ImportRepository();
