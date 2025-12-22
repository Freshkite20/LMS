import { Router } from 'express';
import { authorize } from '../middlewares/auth.js';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

router.get('/dashboard', authorize(['admin']), AdminController.getDashboard);
router.get('/batches', authorize(['admin']), AdminController.getBatches);
router.get('/courses', authorize(['admin']), AdminController.getCourses);
router.get('/students', authorize(['admin']), AdminController.getStudents);

export default router;

