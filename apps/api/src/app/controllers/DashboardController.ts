import { Request, Response, NextFunction } from 'express';
import { businessService } from '../services/BusinessService';
import { ok } from '@mapleads/shared';

export class DashboardController {
  async overview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [stats, subscription] = await Promise.all([
        businessService.getStats(req.org!.id),
        Promise.resolve(req.org!.subscription),
      ]);

      res.json(ok({
        stats,
        plan: {
          name: subscription?.plan?.name ?? 'BASIC',
          limits: subscription?.plan?.limits,
          expiresAt: subscription?.currentPeriodEnd,
        },
      }));
    } catch (e) { next(e); }
  }
}

export const dashboardController = new DashboardController();
