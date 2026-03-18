import { prisma } from '../../config/database';
import { BaseRepository } from './BaseRepository';

type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

type Organization = Awaited<ReturnType<typeof prisma.organization.findUniqueOrThrow>>;

export class OrganizationRepository extends BaseRepository<Organization> {
  protected model = prisma.organization;

  async findBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
      include: { subscription: { include: { plan: true } } },
    });
  }

  async findWithSubscription(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: { subscription: { include: { plan: true } } },
    });
  }

  async create(data: Record<string, any>) {
    return prisma.organization.create({ data: data as any });
  }

  async update(id: string, data: Record<string, any>) {
    return prisma.organization.update({ where: { id }, data });
  }

  async countAll(): Promise<number> {
    return prisma.organization.count();
  }

  async findAllPaginated(page: number, perPage: number) {
    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { subscription: { include: { plan: true } }, _count: { select: { businesses: true, members: true } } },
      }),
      prisma.organization.count(),
    ]);
    return { orgs, total };
  }

  async addMember(orgId: string, userId: string, role: OrgRole = 'MEMBER') {
    return prisma.orgMember.create({ data: { orgId, userId, role } });
  }

  async getMember(orgId: string, userId: string) {
    return prisma.orgMember.findUnique({ where: { userId_orgId: { userId, orgId } } });
  }

  async getMembers(orgId: string) {
    return prisma.orgMember.findMany({
      where: { orgId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } } },
    });
  }

  async removeMember(orgId: string, userId: string) {
    return prisma.orgMember.delete({ where: { userId_orgId: { userId, orgId } } });
  }

  async countMembers(orgId: string): Promise<number> {
    return prisma.orgMember.count({ where: { orgId } });
  }
}

export const organizationRepository = new OrganizationRepository();
