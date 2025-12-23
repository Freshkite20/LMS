import mongoose, { Document } from 'mongoose';

// TypeScript interface for File document
export interface IFile extends Document {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploaded_by: string;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    uploaded_at: Date;
    extracted_sections: number;
    completed_at?: Date;
}

const fileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    file_name: { type: String, required: true },
    file_path: { type: String, required: true },
    file_type: { type: String, required: true },
    file_size: { type: Number, required: true },
    uploaded_by: { type: String, required: true },
    processing_status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    uploaded_at: { type: Date, default: Date.now },
    extracted_sections: { type: Number, default: 0 },
    completed_at: { type: Date }
});

export const File = mongoose.model<IFile>('File', fileSchema, 'file_uploads');
