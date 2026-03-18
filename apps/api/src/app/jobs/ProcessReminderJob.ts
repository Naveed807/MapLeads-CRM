import { Job, Queue } from 'bullmq';
import { prisma } from '../../config/database';
import { getRedisConnection } from '../../config/redis';
import { logger } from '../middleware/logger';

// Lazy — only created when the worker actually runs (Redis must be available by then)
let _emailQueue: Queue | null = null;
function getEmailQueue(): Queue {
  if (!_emailQueue) _emailQueue = new Queue('email', { connection: getRedisConnection() });
  return _emailQueue;
}

export interface ProcessReminderJobData {
  /** intentionally empty — the job scans all due reminders */
}

export async function processReminders(_job: Job<ProcessReminderJobData>): Promise<void> {
  const now = new Date();

  const dueReminders = await prisma.reminder.findMany({
    where: {
      dueDate: { lte: now },
      isDone:  false,
    },
    include: {
      business: { include: { org: { include: { emailSetting: true } } } },
    },
    take: 200,
  });

  for (const reminder of dueReminders) {
    const org = reminder.business.org;
    if (!org.emailSetting) continue;

    const toEmail = org.emailSetting.fromName ?? org.name;
    const log = await prisma.emailLog.create({
      data: {
        orgId:    org.id,
        bizId:    reminder.bizId,
        toEmail:  toEmail,
        subject:  `Reminder: ${reminder.business.name}`,
        status:   'QUEUED',
      },
    });

    await getEmailQueue().add('send-email', {
      orgId:   org.id,
      to:      toEmail,
      subject: `Reminder: ${reminder.business.name}`,
      body:    reminder.note ?? `Follow-up reminder for ${reminder.business.name}`,
      logId:   log.id,
    });

    await prisma.reminder.update({ where: { id: reminder.id }, data: { isDone: true } });
    logger.info('Reminder queued', { reminderId: reminder.id, bizId: reminder.bizId });
  }
}

export { processReminders as processReminderWorker };
