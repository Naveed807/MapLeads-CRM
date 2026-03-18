import { Router } from 'express';
import { notificationController } from '../../app/controllers/NotificationController';
import { authMiddleware }          from '../../app/middleware/auth';
import { tenantMiddleware }        from '../../app/middleware/tenant';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/',                notificationController.list.bind(notificationController));
router.patch('/:id/read',      notificationController.markRead.bind(notificationController));
router.post('/mark-all-read',  notificationController.markAllRead.bind(notificationController));
router.delete('/:id',          notificationController.dismiss.bind(notificationController));

export default router;
