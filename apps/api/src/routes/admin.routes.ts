import { Router } from 'express';
import { adminController } from '../app/controllers/AdminController';
import { authMiddleware } from '../app/middleware/auth';
import { adminMiddleware } from '../app/middleware/auth';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// System stats
router.get('/stats',                 adminController.getSystemStats.bind(adminController));

// Users
router.get('/users',                 adminController.listUsers.bind(adminController));
router.get('/users/:id',             adminController.getUser.bind(adminController));
router.patch('/users/:id/suspend',   adminController.suspendUser.bind(adminController));
router.delete('/users/:id',          adminController.deleteUser.bind(adminController));

// Organizations
router.get('/orgs',                  adminController.listOrgs.bind(adminController));
router.get('/orgs/:id',              adminController.getOrg.bind(adminController));
router.delete('/orgs/:id',           adminController.deleteOrg.bind(adminController));

// Plans
router.get('/plans',                 adminController.listPlans.bind(adminController));
router.patch('/orgs/:orgId/plan',    adminController.overridePlan.bind(adminController));

// Logs
router.get('/email-logs',            adminController.getEmailLogs.bind(adminController));

export default router;
