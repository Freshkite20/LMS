import { Router } from 'express';
import { body, param } from 'express-validator';
import { authorize } from '../middlewares/auth.js';
import { StudentsController } from '../controllers/studentsController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();

router.post(
  '/enroll',
  authorize(['admin']),
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  body('email').isEmail(),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Invalid Indian phone number'),
  body('batchId').isUUID(),
  validateRequest,
  StudentsController.enroll
);

router.get(
  '/dashboard',
  authorize(['student']), // Only students access their own dashboard via token
  validateRequest,
  StudentsController.getDashboard
);

router.get(
  '/:studentId',
  authorize(['admin', 'student']),
  param('studentId').isUUID(),
  validateRequest,
  StudentsController.getById
);


router.get(
  '/:studentId/courses',
  authorize(['admin', 'student']),
  param('studentId').isUUID(),
  validateRequest,
  StudentsController.getStudentCourses
);

export default router;

