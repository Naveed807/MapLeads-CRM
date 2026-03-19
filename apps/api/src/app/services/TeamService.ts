import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { PLAN_LIMITS } from '../../config/plans';
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  PlanLimitError,
  ConflictError,
  AppError,
} from '../errors/AppError';

type OrgRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'SALES_REP' | 'MEMBER';

const MANAGERIAL_ROLES: OrgRole[] = ['OWNER', 'ADMIN'];

export interface InviteInput {
  email:    string;
  name:     string;
  role:     OrgRole;
  password?: string;  // admin-set temp password; random if omitted
}

export class TeamService {

  // ── List all members ────────────────────────────────────────────────────────
  async listMembers(orgId: string) {
    return prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true, lastLoginAt: true },
        },
        _count: { select: { assignments: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ── Invite / add a member ───────────────────────────────────────────────────
  async inviteMember(orgId: string, input: InviteInput, requesterId: string) {
    await this.assertManagerRole(orgId, requesterId);

    // Fetch plan limits from org subscription
    const org = await prisma.organization.findUnique({
      where:   { id: orgId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!org) throw new NotFoundError('Organization');

    const tier   = (org.subscription?.plan.tier ?? 'BASIC') as string;
    const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS];
    if (!limits) throw new AppError(500, 'PLAN_ERROR', 'Unknown plan tier');

    if (limits.maxTeamMembers <= 1) {
      throw new PlanLimitError(
        'TEAM_NOT_AVAILABLE',
        'Team management is only available on paid plans. Upgrade to FREELANCER or AGENCY.',
      );
    }

    const currentCount = await prisma.orgMember.count({ where: { orgId } });
    if (currentCount >= limits.maxTeamMembers) {
      throw new PlanLimitError(
        'TEAM_LIMIT_EXCEEDED',
        `Your plan allows up to ${limits.maxTeamMembers} team members. Upgrade to add more.`,
      );
    }

    // Never allow assigning OWNER role via invite
    const role: OrgRole = input.role === 'OWNER' ? 'ADMIN' : input.role;

    // Find or create the user
    let user = await prisma.user.findUnique({ where: { email: input.email } });
    let tempPassword: string | null = null;

    if (user) {
      const existing = await prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: user.id, orgId } },
      });
      if (existing) {
        throw new ConflictError('This user is already a member of your organization');
      }
    } else {
      // Create new user – no personal org; they belong to this team org
      tempPassword = input.password ?? crypto.randomBytes(8).toString('hex');
      const hash   = await bcrypt.hash(tempPassword, 12);
      user = await prisma.user.create({
        data: { email: input.email, name: input.name, passwordHash: hash },
      });
    }

    const member = await prisma.orgMember.create({
      data: { orgId, userId: user.id, role: role as any },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
        },
        _count: { select: { assignments: true } },
      },
    });

    return { member, tempPassword };
  }

  // ── Update member role ──────────────────────────────────────────────────────
  async updateMemberRole(orgId: string, targetUserId: string, newRole: OrgRole, requesterId: string) {
    await this.assertManagerRole(orgId, requesterId);

    const member = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
    if (!member) throw new NotFoundError('Team member');
    if (member.role === 'OWNER') throw new ForbiddenError('Cannot change the owner\'s role');

    const role: OrgRole = newRole === 'OWNER' ? 'ADMIN' : newRole;

    return prisma.orgMember.update({
      where: { userId_orgId: { userId: targetUserId, orgId } },
      data:  { role: role as any },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { assignments: true } },
      },
    });
  }

  // ── Remove a member ─────────────────────────────────────────────────────────
  async removeMember(orgId: string, targetUserId: string, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new ForbiddenError('Cannot remove yourself from the organization');
    }
    await this.assertManagerRole(orgId, requesterId);

    const member = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
    if (!member) throw new NotFoundError('Team member');
    if (member.role === 'OWNER') throw new ForbiddenError('Cannot remove the organization owner');

    await prisma.orgMember.delete({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
  }

  // ── Get assignments for a specific member ────────────────────────────────────
  async getMemberAssignments(orgId: string, memberId: string, requesterId: string) {
    await this.assertMemberOfOrg(orgId, requesterId);

    const member = await prisma.orgMember.findUnique({
      where: { id: memberId },
      select: { orgId: true },
    });
    if (!member || member.orgId !== orgId) throw new NotFoundError('Team member');

    return prisma.businessAssignment.findMany({
      where: { memberId },
      include: {
        business: {
          select: { id: true, name: true, category: true, phone: true, email: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // ── Replace all assignments for a member ────────────────────────────────────
  async setMemberAssignments(orgId: string, memberId: string, bizIds: string[], requesterId: string) {
    await this.assertManagerRole(orgId, requesterId);

    const member = await prisma.orgMember.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== orgId) throw new NotFoundError('Team member');

    if (bizIds.length > 0) {
      const count = await prisma.business.count({ where: { id: { in: bizIds }, orgId } });
      if (count !== bizIds.length) {
        throw new ForbiddenError('Some businesses do not belong to your organization');
      }
    }

    await prisma.$transaction([
      prisma.businessAssignment.deleteMany({ where: { memberId } }),
      ...(bizIds.length > 0
        ? [prisma.businessAssignment.createMany({
            data: bizIds.map(bizId => ({ bizId, memberId, assignedBy: requesterId })),
            skipDuplicates: true,
          })]
        : []),
    ]);

    return { assigned: bizIds.length };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────
  private async assertManagerRole(orgId: string, userId: string) {
    const member = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!member) throw new AuthError('Not a member of this organization');
    if (!MANAGERIAL_ROLES.includes(member.role as OrgRole)) {
      throw new ForbiddenError('Only admins and owners can manage team members');
    }
    return member;
  }

  private async assertMemberOfOrg(orgId: string, userId: string) {
    const member = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!member) throw new AuthError('Not a member of this organization');
    return member;
  }
}

export const teamService = new TeamService();
