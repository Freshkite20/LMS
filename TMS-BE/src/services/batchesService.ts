import { BatchesRepository } from '../repositories/batchRepository.js';
import { StudentBatchesRepository } from '../repositories/studentBatchRepository.js';

export class BatchesService {
  static async createBatch(input: { name: string; description?: string; startDate: string; endDate?: string }) {
    const batch = await BatchesRepository.create({
      name: input.name,
      description: input.description || null,
      start_date: input.startDate,
      end_date: input.endDate || null
    });
    return {
      id: batch.id,
      batchCode: batch.batch_code,
      name: batch.name,
      description: batch.description,
      startDate: batch.start_date,
      endDate: batch.end_date,
      status: batch.status,
      createdAt: batch.created_at
    };
  }

  static async getBatches(status: string, page: number, limit: number) {
    const { rows, total } = await BatchesRepository.list({ status, page, limit });
    return {
      batches: rows.map((b: any) => ({
        id: b.id,
        batchCode: b.batch_code,
        name: b.name,
        studentCount: Number(b.student_count || 0),
        courseCount: Number(b.course_count || 0),
        averageProgress: Number(b.average_progress || 0),
        startDate: b.start_date,
        status: b.status
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  }

  static async assignStudents(batchId: string, studentIds: string[]) {
    for (const sid of studentIds) {
      await StudentBatchesRepository.assign(sid, batchId);
    }
    return { batchId, assignedCount: studentIds.length, studentIds };
  }

  static async getBatchProgress(batchId: string) {
    const progress = await BatchesRepository.getProgress(batchId);
    return progress;
  }
}

