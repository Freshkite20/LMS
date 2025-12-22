import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService.js';

export class AdminController {
  static async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getDashboardStats();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getBatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batches = await AdminService.getBatches();
      res.json({ success: true, data: batches });
    } catch (err) {
      next(err);
    }
  }

  static async getCourses(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courses = await AdminService.getCourses();
      res.json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  }

  static async getStudents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await AdminService.getRecentStudents();
      res.json({ success: true, data: students });
    } catch (err) {
      next(err);
    }
  }
}

