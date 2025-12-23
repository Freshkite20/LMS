import { Request, Response, NextFunction } from 'express';
import { BatchesService } from '../services/batchesService.js';

export class BatchesController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await BatchesService.createBatch(req.body);
      res.status(200).json({ success: true, data, message: 'Batch created successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page = '1', limit = '10' } = req.query;
      const data = await BatchesService.getBatches(String(status || ''), Number(page), Number(limit));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async assignStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId } = req.params;
      const { studentIds } = req.body as { studentIds: string[] };
      const data = await BatchesService.assignStudents(batchId, studentIds);
      res.json({ success: true, data, message: `${data.assignedCount} students assigned to batch successfully` });
    } catch (err) {
      next(err);
    }
  }

  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId } = req.params;
      const data = await BatchesService.getBatchProgress(batchId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

