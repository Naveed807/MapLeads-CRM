import { Router } from 'express';
import { organizationController } from '../../app/controllers/OrganizationController';
import { userController } from '../../app/controllers/UserController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';
import { validate } from '../../app/middleware/validate';
import { updateOrgSchema, changePasswordSchema } from '@mapleads/shared';

const router = Router();
router.use(authMiddleware);

// User profile
router.get('/me',               userController.getProfile.bind(userController));
router.patch('/me',             userController.updateProfile.bind(userController));
router.patch('/me/password',    validate(changePasswordSchema), userController.changePassword.bind(userController));

// Organization (tenant-scoped)
router.get('/org',              tenantMiddleware, organizationController.get.bind(organizationController));
router.patch('/org',            tenantMiddleware, validate(updateOrgSchema), organizationController.update.bind(organizationController));
router.get('/org/members',      tenantMiddleware, organizationController.getMembers.bind(organizationController));
router.delete('/org/members/:userId', tenantMiddleware, organizationController.removeMember.bind(organizationController));

export default router;
