import { prisma } from '../../config/database';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { userRepository } from '../repositories/UserRepository';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import type { UpdateOrgInput } from '@mapleads/shared';

export class OrganizationService {
  async get(orgId: string) {
    return organizationRepository.findWithSubscription(orgId);
  }

  async update(orgId: string, input: UpdateOrgInput, userId: string) {
    const member = await organizationRepository.getMember(orgId, userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenError('Only owners and admins can update org settings');
    }
    return organizationRepository.update(orgId, input);
  }

  async getMembers(orgId: string) {
    return organizationRepository.getMembers(orgId);
  }

  async removeMember(orgId: string, targetUserId: string, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new ForbiddenError('Cannot remove yourself from the organization');
    }
    const requester = await organizationRepository.getMember(orgId, requesterId);
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new ForbiddenError('Only owners and admins can remove members');
    }
    await organizationRepository.removeMember(orgId, targetUserId);
  }
}

export const organizationService = new OrganizationService();
