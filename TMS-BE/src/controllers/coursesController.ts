import { Request, Response, NextFunction } from 'express';
import { CoursesService } from '../services/coursesService.js';

export class CoursesController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CoursesService.createCourse(req.body);
      res.status(200).json({ success: true, data, message: 'Course created successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async addSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const data = await CoursesService.addSection(courseId, req.body);
      res.json({ success: true, data, message: 'Section added successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async uploadContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const file = req.file!;
      const userId = req.user!.sub; // Get user ID from authenticated user
      const data = await CoursesService.uploadContent(courseId, file, userId);
      res.json({ success: true, data, message: 'File uploaded. Processing started.' });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const includeSections = String(req.query.includeSections || 'false') === 'true';
      const data = await CoursesService.getCourse(courseId, includeSections);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const data = await CoursesService.publishCourse(courseId);
      res.json({ success: true, data, message: 'Course published successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const data = await CoursesService.assignCourse(courseId, req.body);
      res.json({ success: true, data, message: data.message });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const data = await CoursesService.listCourses(status);
      res.json({ success: true, data, count: data.length });
    } catch (err) {
      next(err);
    }
  }
}

