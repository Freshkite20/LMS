import mongoose, { Document } from 'mongoose';

// TypeScript interface for StudentProgress document
export interface IStudentProgress extends Document {
    student_id: string;
    course_id: string;
    section_id: string;
    completed: boolean;
    completed_at?: Date;
    time_spent: number;
}

const studentProgressSchema = new mongoose.Schema({
    student_id: { type: String, required: true },
    course_id: { type: String, required: true },
    section_id: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completed_at: { type: Date },
    time_spent: { type: Number, default: 0 }
});

studentProgressSchema.index({ student_id: 1, course_id: 1, section_id: 1 }, { unique: true });

export const StudentProgress = mongoose.model<IStudentProgress>('StudentProgress', studentProgressSchema, 'student_progress');
