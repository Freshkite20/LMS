import { v4 as uuidv4 } from 'uuid';
import { Batch } from '../models/Batch.js';
import { StudentBatch } from '../models/StudentBatch.js';

export class BatchesRepository {
  static async create(input: { name: string; description: string | null; start_date: string; end_date: string | null }) {
    const code = `B${String(Math.floor(Math.random() * 900) + 100)}`;
    const now = new Date();
    const batch = {
      id: uuidv4(),
      batch_code: code,
      name: input.name,
      description: input.description,
      start_date: input.start_date,
      end_date: input.end_date,
      status: 'active',
      created_at: now,
      updated_at: now
    };
    await Batch.create(batch);
    return batch;
  }
  static async list({ status, page, limit }: { status?: string; page: number; limit: number }) {
    const offset = (page - 1) * limit;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const total = await Batch.countDocuments(query);
    const rows = await Batch
      .find(query)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

      console.log("ROWS",rows)

    // Keep placeholder stats as before
    const rowsWithStats = rows.map((b: any) => ({
      ...b,
      student_count: 0,
      course_count: 0,
      average_progress: 0
    }));

    return { rows: rowsWithStats, total };
  }
  static async getById(batchId: string) {
    return Batch.findOne({ id: batchId });
  }
  static async getByStudentId(studentId: string) {
    const studentBatches = await StudentBatch.find({ student_id: studentId }).lean();
    if (!studentBatches.length) return [];

    const batchIds = Array.from(new Set(studentBatches.map((sb: any) => sb.batch_id)));
    const batches = await Batch.find({ id: { $in: batchIds } }).lean();

    return batches.map((b: any) => {
      const sb = studentBatches.find((s: any) => s.batch_id === b.id);
      return { ...b, enrolled_at: sb?.enrolled_at ?? null };
    });
  }
  static async getProgress(batchId: string) {
    const batch = await this.getById(batchId);
    if (!batch) return null;
    return {
      batchId: batch.id,
      batchName: batch.name,
      totalStudents: 0,
      courses: [],
      overallProgress: 0
    };
  }
}
