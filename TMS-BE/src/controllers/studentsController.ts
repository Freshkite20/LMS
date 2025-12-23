import { Request, Response, NextFunction } from 'express';
import { StudentsService } from '../services/studentsService.js';
import createError from 'http-errors';

export class StudentsController {
  static async enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await StudentsService.enrollStudent(req.body);
      res.status(200).json({ success: true, data, message: 'Student enrolled successfully. Welcome email sent.' });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const data = await StudentsService.getStudentById(studentId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const data = await StudentsService.getStudentCourses(studentId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.email) {
        throw createError(401, 'User not authenticated');
      }
      const data = await StudentsService.getDashboardStats(req.user.email);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

