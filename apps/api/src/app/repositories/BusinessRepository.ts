import { prisma } from '../../config/database';
import { getRedis } from '../../config/redis';
import { BaseRepository } from './BaseRepository';

type Business      = Awaited<ReturnType<typeof prisma.business.findUniqueOrThrow>>;
type ContactStatus = 'NOT_CONTACTED' | 'CONTACTED' | 'REPLIED' | 'CONVERTED' | 'NOT_INTERESTED' | 'NOT_ON_WHATSAPP';

const CACHE_TTL = 60; // seconds

export class BusinessRepository extends BaseRepository<Business> {
  protected model = prisma.business;

  async findByOrg(
    orgId: string,
    opts: {
      page:    number;
      perPage: number;
      search?: string;
      status?: ContactStatus;
      tag?:    string;
      sortBy:  string;
      sortDir: 'asc' | 'desc';
      ids?:    string[];     // restrict to these business IDs (used for SALES_REP)
    },
  ) {
    const { page, perPage, search, status, tag, sortBy, sortDir, ids } = opts;

    const where: Record<string, any> = {
      orgId,
      ...(ids      && { id:      { in: ids } }),
      ...(search   && {
        OR: [
          { name:     { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { address:  { contains: search, mode: 'insensitive' } },
          { phone:    { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status   && { contact: { status } }),
      ...(tag      && { tags:    { some: { tag } } }),
    };

    const orderBy: Record<string, any> = {
      [sortBy]: sortDir,
    };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
        include: { contact: true, tags: true, reminders: { where: { isDone: false } } },
      }),
      prisma.business.count({ where }),
    ]);

    return { businesses, total };
  }

  async findByIdAndOrg(id: string, orgId: string) {
    return prisma.business.findFirst({
      where: { id, orgId },
      include: { contact: true, tags: true, reminders: true },
    });
  }

  async createMany(data: Record<string, any>[]): Promise<{ count: number }> {
    return prisma.business.createMany({ data: data as any, skipDuplicates: true });
  }

  async countByOrg(orgId: string): Promise<number> {
    try {
      const redis  = getRedis();
      const key    = `org:${orgId}:biz:count`;
      const cached = await redis.get(key);
      if (cached !== null) return Number(cached);

      const count = await prisma.business.count({ where: { orgId } });
      await redis.setex(key, CACHE_TTL, count).catch(() => {});
      return count;
    } catch {
      // Redis unavailable — query DB directly
      return prisma.business.count({ where: { orgId } });
    }
  }

  async invalidateOrgCache(orgId: string): Promise<void> {
    try {
      const redis = getRedis();
      const keys  = await redis.keys(`org:${orgId}:*`);
      if (keys.length) await redis.del(...keys);
    } catch {
      // Redis unavailable — skip cache invalidation
    }
  }

  async getStats(orgId: string) {
    const [total, withPhone, contacts] = await Promise.all([
      prisma.business.count({ where: { orgId } }),
      prisma.business.count({ where: { orgId, phone: { not: null } } }),
      prisma.contact.groupBy({
        by:    ['status'],
        where: { business: { orgId } },
        _count: { status: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const c of contacts) {
      statusMap[c.status] = c._count.status;
    }

    return {
      total,
      withPhone,
      contacted:      statusMap['CONTACTED']        || 0,
      replied:        statusMap['REPLIED']           || 0,
      converted:      statusMap['CONVERTED']         || 0,
      not_interested: statusMap['NOT_INTERESTED']    || 0,
      not_on_whatsapp: statusMap['NOT_ON_WHATSAPP']  || 0,
    };
  }

  async deleteByOrg(orgId: string): Promise<void> {
    await prisma.business.deleteMany({ where: { orgId } });
    await this.invalidateOrgCache(orgId);
  }
}

export const businessRepository = new BusinessRepository();
