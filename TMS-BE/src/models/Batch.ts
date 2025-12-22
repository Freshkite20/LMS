import mongoose, { Document } from 'mongoose';

// TypeScript interface for Batch document
export interface IBatch extends Document {
    id: string;
    batch_code: string;
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    status: 'active' | 'archived';
    created_at: Date;
    updated_at: Date;
}

const batchSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    batch_code: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    start_date: { type: String, required: true },
    end_date: { type: String },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
