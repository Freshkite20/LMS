import mongoose, { Document } from 'mongoose';

// TypeScript interface for Course document
export interface ICourse extends Document {
    id: string;
    course_code: string;
    title: string;
    description: string;
    category: string;
    template_type: string;
    difficulty: string;
    estimated_duration: string;
    status: 'draft' | 'published' | 'archived';
    created_at: Date;
    updated_at: Date;
}

const courseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    course_code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    template_type: { type: String, required: true },
    difficulty: { type: String, required: true },
    estimated_duration: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Course = mongoose.model<ICourse>('Course', courseSchema);
