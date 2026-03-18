import { Job } from 'bullmq';
import { prisma } from '../../config/database';
import { getMailer } from '../../config/mailer';
import { logger } from '../middleware/logger';

export interface SendEmailJobData {
  orgId:    string;
  to:       string;
  subject:  string;
  body:     string;
  logId:    string;
}

export async function processSendEmail(job: Job<SendEmailJobData>): Promise<void> {
  const mailer = getMailer();
  const { orgId, to, subject, body, logId } = job.data;

  try {
    const settings = await prisma.emailSetting.findUnique({ where: { orgId } });
    if (!settings?.serviceId) throw new Error('No email settings configured for organisation');

    // Send via EmailJS SDK (serviceId/templateId/publicKey from settings)
    await (mailer as any).send(
      settings.serviceId,
      settings.templateId ?? '',
      { to_email: to, subject, message: body },
      settings.publicKey ?? '',
    );

    await prisma.emailLog.update({
      where: { id: logId },
      data:  { status: 'SENT', sentAt: new Date() },
    });

    logger.info('Email sent', { logId, to });
  } catch (err: any) {
    logger.error('Email failed', { logId, error: err.message });
    await prisma.emailLog.update({
      where: { id: logId },
      data:  { status: 'FAILED', errorMsg: err.message },
    }).catch(() => {});
    throw err;
  }
}

export { processSendEmail as sendEmailWorker };
