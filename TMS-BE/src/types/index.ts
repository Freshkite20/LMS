// Common type definitions for the TMS application

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    statusCode: number;
    details?: any;
}

// User-related types
export interface UserPayload {
    id: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    name: string;
}

export interface AuthenticatedRequest extends Express.Request {
    user?: UserPayload;
}

// File upload types
export interface FileUploadResult {
    fileId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
}

// Test-related types
export interface QuestionAnswer {
    questionId: string;
    answerText: string;
}

export interface TestSubmissionInput {
    studentId: string;
    answers: QuestionAnswer[];
}

export interface AutoGradeResult {
    submissionId: string;
    submittedAt: Date;
    autoGradedScore: number;
    maxAutoGradedScore: number;
    pendingManualGrading: number;
}

// Progress tracking types
export interface ProgressUpdate {
    studentId: string;
    sectionId: string;
    status: 'not_started' | 'in_progress' | 'completed';
    completionPercentage?: number;
}

// Batch-related types
export interface BatchEnrollment {
    batchId: string;
    studentId: string;
    enrolledAt: Date;
    status: 'active' | 'inactive' | 'completed';
}

// Course-related types
export interface CourseSection {
    id: string;
    title: string;
    description?: string;
    orderIndex: number;
    duration?: number;
}

export interface CourseWithSections {
    id: string;
    title: string;
    description?: string;
    sections: CourseSection[];
    totalSections: number;
}
