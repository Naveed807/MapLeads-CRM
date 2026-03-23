import { prisma } from '../../config/database';
import { PLAN_SEED_DATA } from '../../config/plans';
import { logger } from '../../app/middleware/logger';

export async function seedPlans(): Promise<void> {

  for (const plan of PLAN_SEED_DATA) {
    const fields = {
      name:               plan.name,
      monthlyPriceUsd:    plan.monthlyPriceUsd,
      maxBusinesses:      plan.maxBusinesses,
      maxImportsPerMonth: plan.maxImportsPerMonth,
      maxTeamMembers:     plan.maxTeamMembers,
      maxTemplates:       plan.maxTemplates,
      canExportCsv:       plan.canExportCsv,
      canUseEmailjs:      plan.canUseEmailjs,
      canUseReminders:    plan.canUseReminders,
      canUseAdvancedStats: plan.canUseAdvancedStats,
      canUseBulkActions:  plan.canUseBulkActions,
      canUseApiAccess:    plan.canUseApiAccess,
    };
    await prisma.plan.upsert({
      where:  { tier: plan.tier as any },
      update: fields,
      create: { tier: plan.tier as any, ...fields },
    });
    logger.info(`Plan upserted: ${plan.name}`);
  }
}
