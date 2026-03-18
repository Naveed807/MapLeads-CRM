import { Request, Response, NextFunction } from 'express';
import { billingService } from '../services/BillingService';
import { ok } from '@mapleads/shared';
import { config } from '../../config/app';

export class BillingController {
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await billingService.getPlans();
      res.json(ok(plans));
    } catch (e) { next(e); }
  }

  async getSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await billingService.getSubscription(req.org!.id);
      res.json(ok(sub));
    } catch (e) { next(e); }
  }

  async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await billingService.createCheckoutSession(req.org!.id, req.body.planId, req.user!.id);
      res.json(ok(result));
    } catch (e) { next(e); }
  }

  async createPortalSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await billingService.createPortalSession(req.org!.id);
      res.json(ok(result));
    } catch (e) { next(e); }
  }

  /** Raw body is required for Stripe signature verification — mounted before json() */
  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'] as string;
      await billingService.handleWebhook(req.body as Buffer, sig);
      res.json({ received: true });
    } catch (e) { next(e); }
  }
}

export const billingController = new BillingController();
