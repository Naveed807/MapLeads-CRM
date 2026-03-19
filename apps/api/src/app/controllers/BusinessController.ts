import { Request, Response, NextFunction } from 'express';
import { businessService } from '../services/BusinessService';
import { ok } from '@mapleads/shared';

export class BusinessController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await businessService.list(
        req.org!.id, req.query as any, req.user!.id, req.user!.role.toString(),
      );
      res.json(ok(result));
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const biz = await businessService.getOne(req.params.id as string, req.org!.id);
      res.json(ok(biz));
    } catch (e) { next(e); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const biz = await businessService.updateStatus(req.params.id as string, req.org!.id, req.body.status);
      res.json(ok(biz));
    } catch (e) { next(e); }
  }

  async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const biz = await businessService.updateNote(req.params.id as string, req.org!.id, req.body.note);
      res.json(ok(biz));
    } catch (e) { next(e); }
  }

  async updateTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const biz = await businessService.updateTags(req.params.id as string, req.org!.id, req.body.tags);
      res.json(ok(biz));
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await businessService.delete(req.params.id as string, req.org!.id);
      res.json(ok(null, 'Deleted'));
    } catch (e) { next(e); }
  }

  async bulkUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await businessService.bulkUpdateStatus(req.org!.id, req.body.ids, req.body.status);
      res.json(ok({ count }, `${count} records updated`));
    } catch (e) { next(e); }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const planTier = (req.org!.subscription?.plan as any)?.tier ?? 'BASIC';
      const count = await businessService.bulkDelete(req.org!.id, req.body.ids, planTier);
      res.json(ok({ count }, `${count} records deleted`));
    } catch (e) { next(e); }
  }

  async clearAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await businessService.clearAll(req.org!.id);
      res.json(ok(null, 'All businesses cleared'));
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await businessService.getStats(req.org!.id);
      res.json(ok(stats));
    } catch (e) { next(e); }
  }
}

export const businessController = new BusinessController();
