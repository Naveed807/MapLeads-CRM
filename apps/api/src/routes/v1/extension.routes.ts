import { Router } from 'express';
import { authMiddleware }   from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';
import { planGate }         from '../../app/middleware/planGate';
import { importController } from '../../app/controllers/ImportController';

const router = Router();

// All extension routes require auth + org context + Agency plan (canUseApiAccess)
router.use(authMiddleware, tenantMiddleware, planGate('canUseApiAccess'));

/**
 * POST /api/v1/extension/businesses
 *
 * Accepts a businesses array directly from the Chrome extension and
 * creates an import batch — identical to POST /v1/imports but restricted
 * to Agency plan users only (canUseApiAccess gate).
 *
 * Body: { businesses: RawBusiness[], source?: 'google_maps' }
 * Auth: Authorization: Bearer <accessToken>
 */
router.post('/businesses', importController.importBusinesses.bind(importController));

export default router;
