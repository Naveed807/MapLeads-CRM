import { prisma } from '../../config/database';

// Standalone repository — does not extend BaseRepository to avoid Prisma type-inference issues
export class NotificationRepository {
  async createNotification(data: {
    orgId:   string;
    type:    string;
    title:   string;
    body:    string;
    meta?:   Record<string, any>;
    userId?: string;
  }) {
    return (prisma as any).notification.create({
      data: {
        orgId:  data.orgId,
        type:   data.type,
        title:  data.title,
        body:   data.body,
        ...(data.meta   !== undefined ? { meta:   data.meta   } : {}),
        ...(data.userId !== undefined ? { userId: data.userId } : {}),
      },
    });
  }

  async findByOrg(orgId: string, userId: string, limit = 50) {
    return (prisma as any).notification.findMany({
      where: {
        orgId,
        OR: [{ userId: null }, { userId }],
      },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
  }

  async markRead(id: string, orgId: string): Promise<void> {
    await (prisma as any).notification.updateMany({ where: { id, orgId }, data: { read: true } });
  }

  async markAllRead(orgId: string): Promise<void> {
    await (prisma as any).notification.updateMany({ where: { orgId, read: false }, data: { read: true } });
  }

  async dismiss(id: string, orgId: string): Promise<void> {
    await (prisma as any).notification.deleteMany({ where: { id, orgId } });
  }
}

export const notificationRepository = new NotificationRepository();
