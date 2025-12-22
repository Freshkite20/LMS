import { Request, Response, NextFunction } from 'express';
import { TeachersService } from '../services/teachersService.js';

export class TeachersController {
    static async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeachersService.getDashboardStats();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
}
