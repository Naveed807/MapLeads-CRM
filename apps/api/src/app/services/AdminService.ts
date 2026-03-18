import { prisma } from '../../config/database';
import { userRepository } from '../repositories/UserRepository';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { NotFoundError } from '../errors/AppError';

export class AdminService {
  // ── Overview stats ────────────────────────────────────────────────────────
  async getSystemStats() {
    const [
      totalUsers,
      totalOrgs,
      totalBusinesses,
      totalEmailLogs,
      planBreakdown,
      recentUsers,
      recentOrgs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.business.count(),
      prisma.emailLog.count(),
      prisma.subscription.groupBy({ by: ['planId'], _count: { planId: true }, orderBy: { _count: { planId: 'desc' } } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, email: true, createdAt: true, isSuspended: true } }),
      prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { subscription: { include: { plan: true } }, _count: { select: { businesses: true } } } }),
    ]);

    // Resolve plan names
    const plans = await prisma.plan.findMany({ select: { id: true, name: true, tier: true } });
    const planMap = Object.fromEntries(plans.map((p: any) => [p.id, p]));
    const planStats = planBreakdown.map((pb: any) => ({
      plan:  planMap[pb.planId]?.name || 'Unknown',
      tier:  planMap[pb.planId]?.tier || 'Unknown',
      count: pb._count.planId,
    }));

    return { totalUsers, totalOrgs, totalBusinesses, totalEmailLogs, planStats, recentUsers, recentOrgs };
  }

  // ── User management ───────────────────────────────────────────────────────
  async listUsers(page: number, perPage: number, search?: string) {
    return userRepository.findAllPaginated(page, perPage, search);
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: { memberships: { include: { org: { include: { subscription: { include: { plan: true } } } } } } },
    });
    if (!user) throw new NotFoundError('User');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async suspendUser(userId: string, suspend: boolean) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    if ((user as any).isAdmin) throw new NotFoundError('Cannot suspend an admin'); // protect admins
    return userRepository.update(userId, { isSuspended: suspend });
  }

  async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    await userRepository.delete(userId);
  }

  // ── Organization management ───────────────────────────────────────────────
  async listOrgs(page: number, perPage: number) {
    return organizationRepository.findAllPaginated(page, perPage);
  }

  async getOrg(orgId: string) {
    const org = await prisma.organization.findUnique({
      where:   { id: orgId },
      include: {
        subscription: { include: { plan: true } },
        _count:       { select: { businesses: true, members: true, importBatches: true } },
      },
    });
    if (!org) throw new NotFoundError('Organization');
    return org;
  }

  async deleteOrg(orgId: string) {
    await prisma.organization.delete({ where: { id: orgId } });
  }

  // ── Plan management ───────────────────────────────────────────────────────
  async listPlans() {
    return prisma.plan.findMany({ orderBy: { monthlyPriceUsd: 'asc' } });
  }

  async overridePlan(orgId: string, tier: string) {
    const plan = await prisma.plan.findUnique({ where: { tier: tier as any } });
    if (!plan) throw new NotFoundError('Plan');
    await prisma.subscription.update({ where: { orgId }, data: { planId: plan.id } });
    return plan;
  }

  // ── Email logs ────────────────────────────────────────────────────────────
  async getEmailLogs(page: number, perPage: number) {
    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        skip:    (page - 1) * perPage,
        take:    perPage,
        orderBy: { sentAt: 'desc' },
        include: { org: { select: { name: true } } },
      }),
      prisma.emailLog.count(),
    ]);
    return { logs, total };
  }
}

export const adminService = new AdminService();
