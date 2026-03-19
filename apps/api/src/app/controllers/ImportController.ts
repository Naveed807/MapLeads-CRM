import { Request, Response, NextFunction } from 'express';
import { importService }       from '../services/ImportService';
import { notificationService } from '../services/NotificationService';
import { ok }                  from '@mapleads/shared';
import { ValidationError }     from '../errors/AppError';

export class ImportController {
  /**
   * Unified import endpoint — accepts pre-parsed businesses from the frontend.
   * Body: { businesses: RawBusiness[], source: 'google_maps' | 'excel' }
   */
  async importBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    const orgId    = req.org!.id;
    const userId   = req.user!.id;
    const planTier = (req.org!.subscription?.plan as any)?.tier ?? 'BASIC';
    const { businesses, source = 'google_maps' } = req.body;

    try {
      if (!Array.isArray(businesses) || businesses.length === 0) {
        throw new ValidationError('businesses must be a non-empty array');
      }

      const result = source === 'excel'
        ? await importService.importFromExcel(orgId, businesses, planTier)
        : await importService.importFromMaps(orgId, businesses, planTier);

      const sourceLabel = source === 'excel' ? 'Excel' : 'Google Maps';
      notificationService.create(
        orgId,
        'IMPORT_SUCCESS',
        'Import completed',
        `${result.added} business${result.added !== 1 ? 'es' : ''} imported from ${sourceLabel}` +
          (result.skipped ? ` (${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped)` : '') + '.',
        { batchId: result.batchId, added: result.added, skipped: result.skipped, source },
        userId,
      ).catch(() => { /* swallow — notification is non-critical */ });

      res.status(201).json(ok(result, `Imported ${result.added} businesses`));
    } catch (e: any) {
      if (e.code === 'IMPORT_LIMIT_EXCEEDED') {
        notificationService.create(orgId, 'IMPORT_LIMIT_REACHED', 'Monthly import limit reached', e.message, undefined, userId).catch(() => {});
      } else if (e.code === 'BUSINESS_LIMIT_EXCEEDED') {
        notificationService.create(orgId, 'BUSINESS_LIMIT_REACHED', 'Business storage limit reached', e.message, undefined, userId).catch(() => {});
      } else {
        notificationService.create(orgId, 'IMPORT_FAILED', 'Import failed', 'An unexpected error occurred. Please try again.', undefined, userId).catch(() => {});
      }
      next(e);
    }
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
