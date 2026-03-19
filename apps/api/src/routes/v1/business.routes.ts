import { Router } from 'express';
import { businessController } from '../../app/controllers/BusinessController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';
import { validate } from '../../app/middleware/validate';
import { planGate } from '../../app/middleware/planGate';
import {
  updateContactStatusSchema,
  updateNoteSchema,
  updateTagsSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
} from '@mapleads/shared';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/',                businessController.list.bind(businessController));
router.get('/stats',           businessController.getStats.bind(businessController));
router.get('/:id',             businessController.getOne.bind(businessController));
router.patch('/:id/status',    validate(updateContactStatusSchema), businessController.updateStatus.bind(businessController));
router.patch('/:id/note',      validate(updateNoteSchema),          businessController.updateNote.bind(businessController));
router.patch('/:id/tags',      validate(updateTagsSchema),          businessController.updateTags.bind(businessController));
router.delete('/:id',          businessController.delete.bind(businessController));
router.get('/:id/assignee',    businessController.getAssignee.bind(businessController));
router.put('/:id/assignee',    businessController.setAssignee.bind(businessController));
router.get('/:id/logs',        businessController.getContactLogs.bind(businessController));

// Bulk operations — require higher plan
router.post('/bulk/status',    planGate('canUseBulkActions'), validate(bulkStatusSchema), businessController.bulkUpdateStatus.bind(businessController));
router.post('/bulk/delete',    planGate('canUseBulkActions'), validate(bulkDeleteSchema), businessController.bulkDelete.bind(businessController));

// Clear all — not plan-gated (user deletes their own data)
router.delete('/',             businessController.clearAll.bind(businessController));

export default router;
