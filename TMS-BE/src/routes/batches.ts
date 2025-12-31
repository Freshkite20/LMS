import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authorize } from '../middlewares/auth.js';
import { BatchesController } from '../controllers/batchesController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();

router.post(
  '/',
  authorize(['admin']),
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601(),
  validateRequest,
  BatchesController.create
);

router.get(
  '/',
  authorize(['admin']),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100}),
  validateRequest,
  BatchesController.getAll
);

router.post(
  '/:batchId/students',
  authorize(['admin']),
  param('batchId').isUUID(),
  body('studentIds').isArray({ min: 1 }),
  validateRequest,
  BatchesController.assignStudents
);

router.get(
  '/:batchId/progress',
  authorize(['admin']),
  param('batchId').isUUID(),
  validateRequest,
  BatchesController.getProgress
);

export default router;

