import mongoose, { Document } from 'mongoose';

// TypeScript interface for User document
export interface IUser extends Document {
    id: string;
    keycloak_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'student' | 'teacher';
    phone: string | null;
    created_at: Date;
    updated_at: Date;
}

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    keycloak_id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student', 'teacher'], required: true },
    phone: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);
