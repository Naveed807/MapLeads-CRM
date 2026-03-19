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

import 'dotenv/config';
import { prisma } from '../config/database';

async function main() {
  const [email, tier] = process.argv.slice(2);

  if (!email || !tier) {
    console.error('Usage: npm run db:set-plan -- <email> <TIER>');
    console.error('  Tiers: BASIC | FREELANCER | AGENCY');
    process.exit(1);
  }

  const upperTier = tier.toUpperCase();

  // Check if user exists first
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`\nUser not found: ${email}`);
    const allUsers = await prisma.user.findMany({ select: { email: true, name: true }, orderBy: { createdAt: 'asc' } });
    if (allUsers.length === 0) {
      console.error('No users in the database. Run: npm run seed');
    } else {
      console.error('\nRegistered users:');
      allUsers.forEach(u => console.error(`  ${u.email}  (${u.name})`));
    }
    await prisma.$disconnect();
    process.exit(1);
  }

  // Users are linked to orgs via OrgMember — find the first membership
  const membership = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { org: true },
  });

  if (!membership) {
    console.error(`\nUser ${email} exists but has no org membership yet.`);
    console.error('They need to complete registration (create an org) first.');
    await prisma.$disconnect();
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

  console.log(`\nOrg: ${membership.org.name} (${user.email})`);
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

