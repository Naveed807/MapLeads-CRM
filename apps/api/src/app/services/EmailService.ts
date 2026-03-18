import { prisma } from '../../config/database';
import { PLAN_LIMITS } from '../../config/plans';
import { PlanLimitError, NotFoundError } from '../errors/AppError';
import { getEmailQueue } from '../../config/queue';
import { QUEUES } from '../../config/queue';
import type { EmailSettingInput, SendEmailInput } from '@mapleads/shared';

export class EmailService {
  async getSettings(orgId: string) {
    return prisma.emailSetting.findUnique({ where: { orgId } });
  }

  async saveSettings(orgId: string, input: EmailSettingInput) {
    return prisma.emailSetting.upsert({
      where:  { orgId },
      create: { orgId, ...input },
      update: { ...input },
    });
  }

  async send(orgId: string, input: SendEmailInput, planTier: string, fromName: string) {
    this.assertPlanFeature(planTier, 'canUseEmailjs');

    const biz = await prisma.business.findFirst({ where: { id: input.bizId, orgId } });
    if (!biz)          throw new NotFoundError('Business');
    if (!biz.email)    throw new NotFoundError('Business has no email address');

    const body = this.interpolate(input.body, biz);

    // Push to queue — non-blocking
    await getEmailQueue().add('send-email', {
      orgId,
      bizId:    biz.id,
      toEmail:  biz.email,
      subject:  this.interpolate(input.subject, biz),
      message:  body,
      fromName,
    });

    return { queued: true };
  }

  private interpolate(template: string, biz: any): string {
    return template
      .replace(/\{name\}/g,     biz.name     || '')
      .replace(/\{phone\}/g,    biz.phone    || '')
      .replace(/\{email\}/g,    biz.email    || '')
      .replace(/\{address\}/g,  biz.address  || '')
      .replace(/\{category\}/g, biz.category || '')
      .replace(/\{website\}/g,  biz.website  || '')
      .replace(/\{rating\}/g,   biz.rating   || '');
  }

  private assertPlanFeature(planTier: string, feature: keyof typeof PLAN_LIMITS.BASIC) {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];
    if (!limits || !limits[feature]) {
      throw new PlanLimitError('FEATURE_NOT_AVAILABLE', 'Email requires Freelancer plan or higher');
    }
  }
}

export const emailService = new EmailService();
