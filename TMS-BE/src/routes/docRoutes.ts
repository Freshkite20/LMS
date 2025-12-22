import { Router } from 'express';
import { body } from 'express-validator';
import { authorize } from '../middlewares/auth.js';
import { DocToCourseController } from '../controllers/docToCourseController.js';
import { validateRequest } from '../utils/validateRequest.js';

const router = Router();

router.post(
    '/create-course',
    authorize(['admin']),
    body('docLink').isString().notEmpty().withMessage('Google Doc Link is required'),
    validateRequest,
    DocToCourseController.createCourseFromDocs
);

export default router;
