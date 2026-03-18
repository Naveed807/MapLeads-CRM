import { initDB, disconnectDB } from '../../config/database';
import { seedPlans } from './planSeeder';
import { seedAdmin } from './adminSeeder';
import { logger } from '../../app/middleware/logger';

async function seed(): Promise<void> {
  await initDB();

  logger.info('Starting database seeding...');
  await seedPlans();
  await seedAdmin();
  logger.info('Database seeding complete.');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
