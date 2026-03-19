import { prisma } from '../../config/database';
import { businessRepository } from '../repositories/BusinessRepository';
import { importRepository } from '../repositories/ImportRepository';
import { PLAN_LIMITS } from '../../config/plans';
import { PlanLimitError, NotFoundError, ForbiddenError } from '../errors/AppError';
import type { BusinessQuery, BulkStatusInput, BulkDeleteInput } from '@mapleads/shared';
type ContactStatus = 'NOT_CONTACTED' | 'CONTACTED' | 'REPLIED' | 'CONVERTED' | 'NOT_INTERESTED' | 'NOT_ON_WHATSAPP';

export class BusinessService {
  async list(orgId: string, query: BusinessQuery, userId?: string, role?: string) {
    const page    = Math.max(1, parseInt(String(query.page    ?? 1),  10) || 1);
    const perPage = Math.min(500, Math.max(1, parseInt(String(query.perPage ?? 20), 10) || 20));

    // SALES_REP: only see businesses that are explicitly assigned to them
    let assignedIds: string[] | undefined;
    if (role === 'SALES_REP' && userId) {
      const member = await prisma.orgMember.findUnique({
        where: { userId_orgId: { userId, orgId } },
        select: { id: true },
      });
      if (!member) return { businesses: [], total: 0 };
      const assignments = await prisma.businessAssignment.findMany({
        where:  { memberId: member.id },
        select: { bizId: true },
      });
      assignedIds = assignments.map(a => a.bizId);
      if (assignedIds.length === 0) return { businesses: [], total: 0 };
    }

    return businessRepository.findByOrg(orgId, {
      page,
      perPage,
      search:  query.search,
      status:  query.status as ContactStatus | undefined,
      tag:     query.tag,
      sortBy:  query.sortBy   ?? 'importedAt',
      sortDir: query.sortDir  ?? 'desc',
      ids:     assignedIds,
    });
  }

  async getOne(id: string, orgId: string) {
    const biz = await businessRepository.findByIdAndOrg(id, orgId);
    if (!biz) throw new NotFoundError('Business');
    return biz;
  }

  async updateStatus(bizId: string, orgId: string, status: ContactStatus, userId?: string) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');

    const timestamps: Record<string, Date | undefined> = {};
    if (status === 'CONTACTED')  timestamps.contactedAt = new Date();
    if (status === 'REPLIED')    timestamps.repliedAt   = new Date();
    if (status === 'CONVERTED')  timestamps.convertedAt = new Date();

    const [contact] = await prisma.$transaction([
      prisma.contact.upsert({
        where:  { bizId },
        create: { bizId, status: status as any, ...timestamps },
        update: { status: status as any, ...timestamps },
      }),
      prisma.contactLog.create({
        data: { bizId, orgId, userId: userId ?? null, action: 'status_changed', detail: status },
      }),
    ]);
    return contact;
  }

  async getAssignee(bizId: string, orgId: string) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');
    return prisma.businessAssignment.findFirst({
      where:   { bizId },
      include: { member: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async setAssignee(bizId: string, orgId: string, memberId: string | null, assignedById: string) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');

    let assigneeName: string | null = null;
    await prisma.$transaction(async (tx) => {
      await tx.businessAssignment.deleteMany({ where: { bizId } });
      if (memberId) {
        const member = await tx.orgMember.findUnique({
          where:   { id: memberId },
          include: { user: { select: { name: true } } },
        });
        if (!member || member.orgId !== orgId) throw new ForbiddenError('Member not found in this organization');
        assigneeName = member.user.name;
        await tx.businessAssignment.create({ data: { bizId, memberId, assignedBy: assignedById } });
      }
      const actor = await tx.user.findUnique({ where: { id: assignedById }, select: { name: true } });
      await tx.contactLog.create({
        data: {
          bizId, orgId, userId: assignedById, action: 'assigned',
          detail: memberId ? `Assigned to ${assigneeName}` : `Unassigned by ${actor?.name ?? 'Admin'}`,
        },
      });
    });
    return this.getAssignee(bizId, orgId);
  }

  async getContactLogs(bizId: string, orgId: string) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');
    return prisma.contactLog.findMany({
      where:   { bizId, orgId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
  }

  async updateNote(bizId: string, orgId: string, note: string) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');
    return prisma.contact.upsert({
      where:  { bizId },
      create: { bizId, note },
      update: { note },
    });
  }

  async updateTags(bizId: string, orgId: string, tags: string[]) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');
    await prisma.$transaction([
      prisma.businessTag.deleteMany({ where: { bizId } }),
      ...(tags.length ? [prisma.businessTag.createMany({ data: tags.map((tag) => ({ bizId, tag })) })] : []),
    ]);
    return tags;
  }

  async delete(bizId: string, orgId: string) {
    const biz = await businessRepository.findByIdAndOrg(bizId, orgId);
    if (!biz) throw new NotFoundError('Business');
    await prisma.business.delete({ where: { id: bizId } });
    await businessRepository.invalidateOrgCache(orgId);
  }

  async bulkUpdateStatus(orgId: string, input: BulkStatusInput, planTier: string) {
    this.assertPlanFeature(planTier, 'canUseBulkActions');
    // Verify all belong to org
    const count = await prisma.business.count({ where: { id: { in: input.ids }, orgId } });
    if (count !== input.ids.length) throw new ForbiddenError('Some businesses do not belong to your organization');

    const status = input.status as ContactStatus;
    const updates = input.ids.map((bizId) =>
      prisma.contact.upsert({
        where:  { bizId },
        create: { bizId, status: status as any },
        update: { status: status as any },
      }),
    );
    await prisma.$transaction(updates);
  }

  async bulkDelete(orgId: string, input: BulkDeleteInput, planTier: string) {
    this.assertPlanFeature(planTier, 'canUseBulkActions');
    const count = await prisma.business.count({ where: { id: { in: input.ids }, orgId } });
    if (count !== input.ids.length) throw new ForbiddenError('Some businesses do not belong to your organization');

    await prisma.business.deleteMany({ where: { id: { in: input.ids }, orgId } });
    await businessRepository.invalidateOrgCache(orgId);
  }

  async getStats(orgId: string) {
    return businessRepository.getStats(orgId);
  }

  /** Clear ALL businesses for an org — not plan-gated (user's own data). */
  async clearAll(orgId: string): Promise<void> {
    await prisma.business.deleteMany({ where: { orgId } });
    await businessRepository.invalidateOrgCache(orgId);
  }

  private assertPlanFeature(planTier: string, feature: keyof typeof PLAN_LIMITS.BASIC) {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    if (!limits || !limits[feature]) {
      throw new PlanLimitError('FEATURE_NOT_AVAILABLE', 'This feature requires a higher plan. Please upgrade.');
    }
  }
}

export const businessService = new BusinessService();
