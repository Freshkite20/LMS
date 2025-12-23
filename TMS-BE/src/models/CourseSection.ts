import mongoose, { Document } from 'mongoose';

// TypeScript interface for CourseSection document
export interface ICourseSection extends Document {
    id: string;
    course_id: string;
    title: string;
    content?: string;
    video_url?: string;
    image_url?: string;
    order_index: number;
    duration?: number;
    created_at: Date;
}

const courseSectionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    course_id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String },
    video_url: { type: String },
    image_url: { type: String },
    order_index: { type: Number, required: true },
    duration: { type: Number },
    created_at: { type: Date, default: Date.now }
});

export const CourseSection = mongoose.model<ICourseSection>('CourseSection', courseSectionSchema, 'course_sections');
