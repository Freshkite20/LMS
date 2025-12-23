import { Router } from 'express';
import { authorize } from '../middlewares/auth.js';
import { TeachersController } from '../controllers/teachersController.js';

const router = Router();

router.get('/dashboard', authorize(['teacher']), TeachersController.getDashboard);

export default router;
