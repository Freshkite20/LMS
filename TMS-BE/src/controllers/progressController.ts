import { Request, Response, NextFunction } from 'express';
import { ProgressService } from '../services/progressService.js';

export class ProgressController {
  static async completeSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sectionId } = req.params;
      const data = await ProgressService.completeSection(sectionId, req.body);
      res.json({ success: true, data, message: 'Section marked as complete' });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, courseId } = req.params;
      const data = await ProgressService.getStudentProgress(studentId, courseId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

