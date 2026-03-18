import { prisma } from '../../config/database';
import { config } from '../../config/app';
import { logger } from '../../app/middleware/logger';
import bcrypt from 'bcrypt';

export async function seedAdmin(): Promise<void> {

  const existing = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existing) {
    logger.info('Admin user already exists — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash(config.admin.password, 12);

  await prisma.user.create({
    data: {
      email:        config.admin.email,
      passwordHash,
      name:         'System Admin',
      isAdmin:      true,
      emailVerifiedAt: new Date(),
    },
  });

  logger.info(`Admin user created: ${config.admin.email}`);
}
