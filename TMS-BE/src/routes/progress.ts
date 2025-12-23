import { Router } from 'express';
import { body, param } from 'express-validator';
import { authorize } from '../middlewares/auth.js';
import { ProgressController } from '../controllers/progressController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();

router.post(
  '/sections/:sectionId/complete',
  authorize(['admin', 'student']),
  param('sectionId').isString().notEmpty(),
  body('studentId').isUUID(),
  body('courseId').isUUID(),
  body('timeSpent').isInt({ min: 0 }),
  validateRequest,
  ProgressController.completeSection
);

router.get(
  '/students/:studentId/courses/:courseId',
  authorize(['admin', 'student']),
  param('studentId').isUUID(),
  param('courseId').isUUID(),
  validateRequest,
  ProgressController.getStudentProgress
);

export default router;

