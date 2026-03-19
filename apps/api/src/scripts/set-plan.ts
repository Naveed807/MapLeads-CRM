/**
 * Dev-only script to upgrade an org's plan by user email.
 *
 * Usage:
 *   npm run db:set-plan -- <email> <TIER>
 *
 * Examples:
 *   npm run db:set-plan -- admin@mapleads.io FREELANCER
 *   npm run db:set-plan -- admin@mapleads.io AGENCY
 *   npm run db:set-plan -- admin@mapleads.io BASIC
 *
 * Valid tiers: BASIC | FREELANCER | AGENCY
 */

import '../config/env';
import { prisma } from '../config/database';

async function main() {
  const [email, tier] = process.argv.slice(2);

  if (!email || !tier) {
    console.error('Usage: npm run db:set-plan -- <email> <TIER>');
    console.error('  Tiers: BASIC | FREELANCER | AGENCY');
    process.exit(1);
  }

  const upperTier = tier.toUpperCase();

  // Users are linked to orgs via OrgMember — find the first membership
  const membership = await prisma.orgMember.findFirst({
    where: { user: { email } },
    include: { user: true, org: true },
  });

  if (!membership) {
    console.error(`No org membership found for: ${email}`);
    process.exit(1);
  }

  const plan = await prisma.plan.findUnique({ where: { tier: upperTier as any } });
  if (!plan) {
    console.error(`Plan tier not found: ${upperTier}`);
    console.error('Run: npm run seed  to populate plans first.');
    process.exit(1);
  }

  const orgId = membership.orgId;
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const sub = await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      planId:             plan.id,
      status:             'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd:   oneYear,
    },
    update: {
      planId:             plan.id,
      status:             'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd:   oneYear,
    },
  });

  console.log(`\nOrg: ${membership.org.name} (${membership.user.email})`);
  console.log(`Plan: ${plan.tier} — ${plan.name}`);
  console.log(`Subscription ID: ${sub.id}`);
  console.log(`Period end: ${sub.currentPeriodEnd.toISOString()}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});

