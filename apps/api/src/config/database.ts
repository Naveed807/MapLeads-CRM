import { PrismaClient } from '@prisma/client';
import { config } from './app';

// Singleton Prisma client
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    log: config.isDevelopment ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (config.isDevelopment) {
  global.__prisma = prisma;
}

export async function initDB(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
}
