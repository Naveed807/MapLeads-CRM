import { Request, Response, NextFunction } from 'express';
import { importService } from '../services/ImportService';
import { ok } from '@mapleads/shared';
import { ValidationError } from '../errors/AppError';

export class ImportController {
  async importFromMaps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId     = req.org!.id;
      const planTier  = (req.org!.subscription?.plan as any)?.tier ?? 'BASIC';
      const batch = await importService.importFromMaps(orgId, req.body.rawText, planTier);
      res.status(201).json(ok(batch, `Imported ${batch.added} businesses`));
    } catch (e) { next(e); }
  }

  async importFromExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new ValidationError('No file uploaded');
      const orgId    = req.org!.id;
      const planTier = (req.org!.subscription?.plan as any)?.tier ?? 'BASIC';
      const batch = await importService.importFromExcel(orgId, req.file.buffer as any, planTier);
      res.status(201).json(ok(batch, `Imported ${batch.added} businesses`));
    } catch (e) { next(e); }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await importService.getHistory(req.org!.id);
      res.json(ok(history));
    } catch (e) { next(e); }
  }

  async deleteBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await importService.deleteBatch(req.params.id as string, req.org!.id);
      res.json(ok(null, 'Import batch deleted'));
    } catch (e) { next(e); }
  }
}

export const importController = new ImportController();
