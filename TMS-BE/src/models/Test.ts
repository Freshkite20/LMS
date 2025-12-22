import mongoose, { Document } from 'mongoose';

// TypeScript interface for Test document
export interface ITest extends Document {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    duration: number;
    passing_score: number;
    created_at: Date;
    updated_at: Date;
}

const testSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    course_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, required: true },
    passing_score: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Test = mongoose.model<ITest>('Test', testSchema, 'tests');
