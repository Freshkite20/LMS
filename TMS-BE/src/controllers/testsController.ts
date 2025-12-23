import { Request, Response, NextFunction } from 'express';
import { TestsService } from '../services/testsService.js';

export class TestsController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TestsService.createTest(req.body);
      res.json({ success: true, data, message: 'Test created successfully' });
    } catch (err) {
      next(err);
    }
  }
  static async uploadQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      const data = await TestsService.uploadQuestions(testId, req.file!);
      res.json({ success: true, data, message: `${data.questionsAdded} questions uploaded successfully` });
    } catch (err) {
      next(err);
    }
  }
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      const includeQuestions = String(req.query.includeQuestions || 'false') === 'true';
      const data = await TestsService.getTest(testId, includeQuestions);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
  static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      const data = await TestsService.submit(testId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
  static async getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId, submissionId } = req.params;
      const data = await TestsService.getSubmission(testId, submissionId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.query.courseId as string;
      if (courseId) {
        const data = await TestsService.getTestsByCourse(courseId);
        res.json({ success: true, data });
      } else {
        // Implement get all tests if needed, or throw error
        res.status(400).json({ success: false, message: 'courseId query parameter is required' });
      }
    } catch (err) {
      next(err);
    }
  }
}

