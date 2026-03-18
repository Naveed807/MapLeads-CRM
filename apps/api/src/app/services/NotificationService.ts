import { notificationRepository } from '../repositories/NotificationRepository';

export type NotifType =
  | 'IMPORT_SUCCESS'
  | 'IMPORT_FAILED'
  | 'IMPORT_LIMIT_REACHED'
  | 'BUSINESS_LIMIT_REACHED'
  | 'PLAN_UPGRADE_REQUIRED'
  | 'SYSTEM';

export class NotificationService {
  /** Create and persist a notification for an org. Returns the created record. */
  async create(orgId: string, type: NotifType, title: string, body: string, meta?: Record<string, any>) {
    return notificationRepository.createNotification({ orgId, type, title, body, meta });
  }

  async listForOrg(orgId: string) {
    return notificationRepository.findByOrg(orgId);
  }

  async markRead(id: string, orgId: string) {
    await notificationRepository.markRead(id, orgId);
  }

  async markAllRead(orgId: string) {
    await notificationRepository.markAllRead(orgId);
  }

  async dismiss(id: string, orgId: string) {
    await notificationRepository.dismiss(id, orgId);
  }
}

export const notificationService = new NotificationService();
