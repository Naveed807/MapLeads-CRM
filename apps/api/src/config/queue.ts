import { Queue, Worker } from 'bullmq';
import { logger } from '../app/middleware/logger';
import { getRedisConnection } from './redis';
import { sendEmailWorker } from '../app/jobs/SendEmailJob';
import { exportCsvWorker } from '../app/jobs/ExportCSVJob';
import { processReminderWorker } from '../app/jobs/ProcessReminderJob';

export const QUEUES = {
  EMAIL:    'email',
  EXPORT:   'export',
  REMINDER: 'reminder',
} as const;

// BullMQ requires connection options (host+port), NOT an ioredis instance,
// to avoid the bundled ioredis version conflict.
function getConnectionOpts() { return getRedisConnection(); }

// Queue instances — lazy-initialized
const queues: Record<string, Queue> = {};

export function getQueue(name: string): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection: getConnectionOpts() });
  }
  return queues[name];
}

export function getEmailQueue():    Queue { return getQueue(QUEUES.EMAIL); }
export function getExportQueue():   Queue { return getQueue(QUEUES.EXPORT); }
export function getReminderQueue(): Queue { return getQueue(QUEUES.REMINDER); }

// Start all workers
export async function startWorkers(): Promise<void> {
  const conn = { connection: getConnectionOpts() };
  new Worker(QUEUES.EMAIL,    sendEmailWorker,        conn);
  new Worker(QUEUES.EXPORT,   exportCsvWorker,        conn);
  new Worker(QUEUES.REMINDER, processReminderWorker,  conn);

  logger.info('BullMQ workers started');
}

