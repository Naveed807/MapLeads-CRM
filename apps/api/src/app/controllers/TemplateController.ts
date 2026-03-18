import { Request, Response, NextFunction } from 'express';
import { templateService } from '../services/TemplateService';
import { ok } from '@mapleads/shared';

export class TemplateController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await templateService.list(req.org!.id);
      res.json(ok(templates));
    } catch (e) { next(e); }
  }

  async getDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await templateService.getDefault(req.org!.id);
      res.json(ok(template));
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const planTier = (req.org!.subscription?.plan as any)?.tier ?? 'BASIC';
      const template = await templateService.create(req.org!.id, req.body, planTier);
      res.status(201).json(ok(template, 'Template created'));
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await templateService.update(req.params.id as string, req.org!.id, req.body);
      res.json(ok(template));
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await templateService.delete(req.params.id as string, req.org!.id);
      res.json(ok(null, 'Template deleted'));
    } catch (e) { next(e); }
  }

  async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await templateService.setDefault(req.params.id as string, req.org!.id);
      res.json(ok(null, 'Default template updated'));
    } catch (e) { next(e); }
  }
}

export const templateController = new TemplateController();
