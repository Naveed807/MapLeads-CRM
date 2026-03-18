import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/NotificationService';
import { ok } from '@mapleads/shared';

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await notificationService.listForOrg(req.org!.id);
      res.json(ok(notifications));
    } catch (e) { next(e); }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markRead(req.params.id as string, req.org!.id);
      res.json(ok(null, 'Marked as read'));
    } catch (e) { next(e); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllRead(req.org!.id);
      res.json(ok(null, 'All notifications marked as read'));
    } catch (e) { next(e); }
  }

  async dismiss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.dismiss(req.params.id as string, req.org!.id);
      res.json(ok(null, 'Notification dismissed'));
    } catch (e) { next(e); }
  }
}

export const notificationController = new NotificationController();
