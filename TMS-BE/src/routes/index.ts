import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import studentsRouter from './students.js';
import batchesRouter from './batches.js';
import coursesRouter from './courses.js';
import progressRouter from './progress.js';
import testsRouter from './tests.js';
import filesRouter from './files.js';
import adminRouter from './admin.js';
import teacherRouter from './teacher.js';
import authRouter from './auth.js';
import docRouter from './docRoutes.js'; // Import docRoutes

const apiRouter = Router();

apiRouter.use('/auth', authRouter); // Public auth endpoints

apiRouter.use(authenticate);
apiRouter.use('/students', studentsRouter);
apiRouter.use('/batches', batchesRouter);
apiRouter.use('/courses', coursesRouter);
apiRouter.use('/progress', progressRouter);
apiRouter.use('/tests', testsRouter);
apiRouter.use('/files', filesRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/teacher', teacherRouter);
apiRouter.use('/docs', docRouter); // Register doc routes

export default apiRouter;

