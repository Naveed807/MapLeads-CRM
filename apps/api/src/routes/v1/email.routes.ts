import { Router } from 'express';
import { emailController } from '../../app/controllers/EmailController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';
import { validate } from '../../app/middleware/validate';
import { planGate } from '../../app/middleware/planGate';
import { emailSettingSchema, sendEmailSchema } from '@mapleads/shared';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/settings',   emailController.getSettings.bind(emailController));
router.put('/settings',   validate(emailSettingSchema), emailController.saveSettings.bind(emailController));
router.post('/send',      planGate('canUseEmailjs'), validate(sendEmailSchema), emailController.send.bind(emailController));

export default router;
