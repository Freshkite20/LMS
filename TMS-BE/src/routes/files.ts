import { Router } from 'express';
import { param, body } from 'express-validator';
import { authorize } from '../middlewares/auth.js';
import { FilesController } from '../controllers/filesController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();

// CREATE file
router.post(
  '/',
  authorize(['admin']),
  body('file_name').notEmpty(),
  body('file_path').notEmpty(),
  body('file_type').notEmpty(),
  body('file_size').isNumeric(),
  body('uploaded_by').notEmpty(),
  validateRequest,
  FilesController.create
);

// UPDATE status
router.patch(
  '/:fileId/status',
  authorize(['admin']),
  param('fileId').isUUID(),
  body('status').isIn(['pending', 'processing', 'completed', 'failed']),
  validateRequest,
  FilesController.updateStatus
);

// GET status
router.get(
  '/:fileId/status',
  authorize(['admin']),
  param('fileId').isUUID(),
  validateRequest,
  FilesController.getStatus
);

export default router;
