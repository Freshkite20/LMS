import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { authorize } from '../middlewares/auth.js';
import { TestsController } from '../controllers/testsController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get(
  '/',
  authorize(['admin', 'student']),
  query('courseId').optional().isString(),
  validateRequest,
  TestsController.list
);

router.post(
  '/',
  authorize(['admin']),
  body('courseId').isUUID(),
  body('title').isString().notEmpty(),
  body('description').optional().isString(),
  body('duration').isInt({ min: 1 }),
  body('passingScore').optional().isInt({ min: 0, max: 100 }),
  validateRequest,
  TestsController.create
);

router.post(
  '/:testId/upload-questions',
  authorize(['admin']),
  param('testId').isUUID(),
  upload.single('file'),
  validateRequest,
  TestsController.uploadQuestions
);

router.get(
  '/:testId',
  authorize(['admin', 'student']),
  param('testId').isUUID(),
  query('includeQuestions').optional().isBoolean().toBoolean(),
  validateRequest,
  TestsController.getById
);

router.post(
  '/:testId/submit',
  authorize(['admin', 'student']),
  param('testId').isUUID(),
  body('studentId').isUUID(),
  body('answers').isArray({ min: 1 }),
  validateRequest,
  TestsController.submit
);

router.get(
  '/:testId/submissions/:submissionId',
  authorize(['admin', 'student']),
  param('testId').isUUID(),
  param('submissionId').isUUID(),
  validateRequest,
  TestsController.getSubmission
);

export default router;

