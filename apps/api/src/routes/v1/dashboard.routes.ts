import { Router } from 'express';
import { dashboardController } from '../../app/controllers/DashboardController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/overview', dashboardController.overview.bind(dashboardController));

export default router;
