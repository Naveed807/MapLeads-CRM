import { templateRepository } from '../repositories/TemplateRepository';
import { PLAN_LIMITS } from '../../config/plans';
import { PlanLimitError, NotFoundError, ForbiddenError } from '../errors/AppError';
import type { CreateTemplateInput, UpdateTemplateInput } from '@mapleads/shared';

export class TemplateService {
  async list(orgId: string, type?: string) {
    return templateRepository.findByOrg(orgId, type);
  }

  async getDefault(orgId: string, type = 'whatsapp') {
    return templateRepository.findDefault(orgId, type);
  }

  async create(orgId: string, input: CreateTemplateInput, planTier: string) {
    await this.assertLimit(orgId, planTier);
    return templateRepository.create({
      name: input.name,
      body: input.body,
      type: input.type || 'whatsapp',
      org:  { connect: { id: orgId } },
    });
  }

  async update(id: string, orgId: string, input: UpdateTemplateInput) {
    const tpl = await templateRepository.findById(id);
    if (!tpl || (tpl as any).orgId !== orgId) throw new NotFoundError('Template');
    return templateRepository.update(id, orgId, input);
  }

  async delete(id: string, orgId: string) {
    const tpl = await templateRepository.findById(id);
    if (!tpl || (tpl as any).orgId !== orgId) throw new NotFoundError('Template');
    if ((tpl as any).isDefault) throw new ForbiddenError('Cannot delete the active template');
    await templateRepository.delete(id);
  }

  async setDefault(id: string, orgId: string) {
    const tpl = await templateRepository.findById(id);
    if (!tpl || (tpl as any).orgId !== orgId) throw new NotFoundError('Template');
    await templateRepository.setDefault(id, orgId, (tpl as any).type);
    return tpl;
  }

  private async assertLimit(orgId: string, planTier: string): Promise<void> {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    if (!limits || limits.maxTemplates === -1) return;
    const count = await templateRepository.countByOrg(orgId);
    if (count >= limits.maxTemplates) {
      throw new PlanLimitError(
        'TEMPLATE_LIMIT_EXCEEDED',
        `You've reached the template limit of ${limits.maxTemplates}. Upgrade to create more.`,
      );
    }
  }
}

export const templateService = new TemplateService();
