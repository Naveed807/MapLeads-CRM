import { prisma } from '../../config/database';
import { PLAN_SEED_DATA } from '../../config/plans';
import { logger } from '../../app/middleware/logger';

export async function seedPlans(): Promise<void> {

  for (const plan of PLAN_SEED_DATA) {
    await prisma.plan.upsert({
      where:  { tier: plan.tier as any },
      update: {
        name:            plan.name,
        monthlyPriceUsd: plan.monthlyPriceUsd,
      },
      create: {
        tier:            plan.tier as any,
        name:            plan.name,
        monthlyPriceUsd: plan.monthlyPriceUsd,
      },
    });
    logger.info(`Plan upserted: ${plan.name}`);
  }
}
