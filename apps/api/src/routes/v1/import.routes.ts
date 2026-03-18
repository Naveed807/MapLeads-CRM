import { Router } from 'express';
import multer from 'multer';
import { importController } from '../../app/controllers/ImportController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/',                   importController.getHistory.bind(importController));
router.post('/maps',              importController.importFromMaps.bind(importController));
router.post('/excel',             (upload.single('file') as any), importController.importFromExcel.bind(importController));
router.delete('/:id',             importController.deleteBatch.bind(importController));

export default router;
