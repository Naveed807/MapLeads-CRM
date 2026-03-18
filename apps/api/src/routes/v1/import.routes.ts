import { Router }            from 'express';
import { importController }  from '../../app/controllers/ImportController';
import { authMiddleware }    from '../../app/middleware/auth';
import { tenantMiddleware }  from '../../app/middleware/tenant';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/',    importController.getHistory.bind(importController));
router.post('/',   importController.importBusinesses.bind(importController));   // pre-parsed businesses array
router.delete('/:id', importController.deleteBatch.bind(importController));

export default router;
