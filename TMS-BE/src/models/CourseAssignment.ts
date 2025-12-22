import mongoose, { Document } from 'mongoose';

// TypeScript interface for CourseAssignment document
export interface ICourseAssignment extends Document {
    id: string;
    course_id: string;
    student_id: string;
    due_date: Date | null;
    assigned_at: Date;
}

const courseAssignmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    course_id: { type: String, required: true },
    student_id: { type: String, required: true },
    due_date: { type: Date, default: null },
    assigned_at: { type: Date, default: Date.now }
});

export const CourseAssignment = mongoose.model<ICourseAssignment>('CourseAssignment', courseAssignmentSchema, 'course_assignments');
