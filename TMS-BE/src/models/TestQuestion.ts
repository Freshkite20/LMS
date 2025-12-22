import mongoose, { Document } from 'mongoose';

// TypeScript interface for TestQuestion document
export interface ITestQuestion extends Document {
    id: string;
    test_id: string;
    question_type: 'mcq' | 'text';
    question_text: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_answer?: string;
    points: number;
    order_index: number;
}

const testQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    test_id: { type: String, required: true },
    question_type: { type: String, enum: ['mcq', 'text'], required: true },
    question_text: { type: String, required: true },
    option_a: { type: String },
    option_b: { type: String },
    option_c: { type: String },
    option_d: { type: String },
    correct_answer: { type: String },
    points: { type: Number, required: true },
    order_index: { type: Number, required: true }
});

export const TestQuestion = mongoose.model<ITestQuestion>('TestQuestion', testQuestionSchema, 'test_questions');
