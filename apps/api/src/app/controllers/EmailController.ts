import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/EmailService';
import { ok } from '@mapleads/shared';

export class EmailController {
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await emailService.getSettings(req.org!.id);
      res.json(ok(settings));
    } catch (e) { next(e); }
  }

  async saveSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await emailService.saveSettings(req.org!.id, req.body);
      res.json(ok(null, 'Email settings saved'));
    } catch (e) { next(e); }
  }

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const planTier = (req.org!.subscription?.plan as any)?.tier ?? 'BASIC';
      const fromName = (req.org as any)?.name ?? 'MapLeads CRM';
      await emailService.send(req.org!.id, req.body, planTier, fromName);
      res.json(ok(null, 'Email queued for delivery'));
    } catch (e) { next(e); }
  }
}

export const emailController = new EmailController();
