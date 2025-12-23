import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { authorize } from '../middlewares/auth.js';
import { CoursesController } from '../controllers/coursesController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// GET all courses - must be before /:courseId route
router.get(
  '/',
  authorize(['admin', 'student']),
  query('status').optional().isIn(['draft', 'published', 'archived']),
  validateRequest,
  CoursesController.list
);

router.post(
  '/',
  authorize(['admin']),
  body('title').isString().notEmpty(),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('templateType').isIn(['video-only', 'text-video', 'text-image', 'text-only']),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('estimatedDuration').optional().isInt({ min: 0 }),
  validateRequest,
  CoursesController.create
);

router.post(
  '/:courseId/sections',
  authorize(['admin']),
  param('courseId').isUUID(),
  body('title').isString().notEmpty(),
  body('content').optional().isString(),
  body('videoUrl').optional().isURL(),
  body('imageUrl').optional({ nullable: true }).isURL({ require_protocol: true }),
  body('orderIndex').isInt({ min: 1 }),
  body('duration').optional().isInt({ min: 0 }),
  validateRequest,
  CoursesController.addSection
);

router.post(
  '/:courseId/upload-content',
  authorize(['admin']),
  param('courseId').isUUID(),
  upload.single('file'),
  validateRequest,
  CoursesController.uploadContent
);

router.get(
  '/:courseId',
  authorize(['admin', 'student']),
  param('courseId').isUUID(),
  query('includeSections').optional().isBoolean().toBoolean(),
  validateRequest,
  CoursesController.getById
);

router.put(
  '/:courseId/publish',
  authorize(['admin']),
  param('courseId').isUUID(),
  validateRequest,
  CoursesController.publish
);

router.post(
  '/:courseId/assign',
  authorize(['admin']),
  param('courseId').isUUID(),
  body('assignmentType').isIn(['individual', 'batch']),
  body('studentIds').optional().isArray(),
  body('batchIds').optional().isArray(),
  body('dueDate').optional().isISO8601(),
  validateRequest,
  CoursesController.assign
);

export default router;

