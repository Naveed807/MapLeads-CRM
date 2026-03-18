import { Router } from 'express';
import { templateController } from '../../app/controllers/TemplateController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';
import { validate } from '../../app/middleware/validate';
import { createTemplateSchema, updateTemplateSchema } from '@mapleads/shared';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/',                    templateController.list.bind(templateController));
router.get('/default',             templateController.getDefault.bind(templateController));
router.post('/',                   validate(createTemplateSchema), templateController.create.bind(templateController));
router.patch('/:id',               validate(updateTemplateSchema), templateController.update.bind(templateController));
router.patch('/:id/set-default',   templateController.setDefault.bind(templateController));
router.delete('/:id',              templateController.delete.bind(templateController));

export default router;
