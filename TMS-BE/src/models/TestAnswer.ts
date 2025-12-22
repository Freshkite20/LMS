import mongoose, { Document } from 'mongoose';

// TypeScript interface for TestAnswer document
export interface ITestAnswer extends Document {
    id: string;
    submission_id: string;
    question_id: string;
    answer_text?: string;
    is_correct: boolean | null;
    points_earned: number;
}

const testAnswerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    submission_id: { type: String, required: true },
    question_id: { type: String, required: true },
    answer_text: { type: String },
    is_correct: { type: Boolean, default: null },
    points_earned: { type: Number, default: 0 }
});

export const TestAnswer = mongoose.model<ITestAnswer>('TestAnswer', testAnswerSchema, 'test_answers');
