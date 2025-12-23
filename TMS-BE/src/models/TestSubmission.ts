import mongoose, { Document } from 'mongoose';

// TypeScript interface for TestSubmission document
export interface ITestSubmission extends Document {
    id: string;
    test_id: string;
    student_id: string;
    status: 'submitted' | 'graded';
    submitted_at: Date;
    score: number;
    max_score: number;
}

const testSubmissionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    test_id: { type: String, required: true },
    student_id: { type: String, required: true },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    submitted_at: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    max_score: { type: Number, default: 0 }
});

export const TestSubmission = mongoose.model<ITestSubmission>('TestSubmission', testSubmissionSchema, 'test_submissions');
