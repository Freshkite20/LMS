import { Request, Response, NextFunction } from 'express';
import { FilesService } from '../services/filesService.js';

export class FilesController {

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = await FilesService.createFile(req.body);
      res.json({ success: true, data: file });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;
      const { status } = req.body;

      const result = await FilesService.updateStatus(fileId, status);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;
      const data = await FilesService.getStatus(fileId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

