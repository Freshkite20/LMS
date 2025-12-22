import { StudentBatch } from '../models/StudentBatch.js';

export class StudentBatchesRepository {
  static async assign(studentId: string, batchId: string) {
    await StudentBatch.updateOne(
      { student_id: studentId, batch_id: batchId },
      {
        $setOnInsert: {
          student_id: studentId,
          batch_id: batchId,
          enrolled_at: new Date()
        }
      },
      { upsert: true }
    );
  }
}
