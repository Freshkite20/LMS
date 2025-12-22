import mongoose, { Document } from 'mongoose';

// TypeScript interface for StudentBatch document
export interface IStudentBatch extends Document {
    student_id: string;
    batch_id: string;
    enrolled_at: Date;
}

const studentBatchSchema = new mongoose.Schema({
    student_id: { type: String, required: true },
    batch_id: { type: String, required: true },
    enrolled_at: { type: Date, default: Date.now }
});

studentBatchSchema.index({ student_id: 1, batch_id: 1 }, { unique: true });

export const StudentBatch = mongoose.model<IStudentBatch>('StudentBatch', studentBatchSchema, 'student_batches');
