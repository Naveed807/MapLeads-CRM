import { Router, Request, Response, NextFunction } from 'express';
import { billingController } from '../../app/controllers/BillingController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';
import express from 'express';

const router = Router();

// Stripe webhooks require raw body — mount BEFORE json middleware applies
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  billingController.webhook.bind(billingController),
);

// All other billing routes need auth
router.use(authMiddleware, tenantMiddleware);

router.get('/plans',             billingController.getPlans.bind(billingController));
router.get('/subscription',      billingController.getSubscription.bind(billingController));
router.post('/checkout',         billingController.createCheckoutSession.bind(billingController));
router.post('/portal',           billingController.createPortalSession.bind(billingController));

export default router;
