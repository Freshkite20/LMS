/**
 * Application Constants
 * Centralized location for all constant values used across the application
 */

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Course Statuses
export const COURSE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
} as const;

export type CourseStatus = typeof COURSE_STATUS[keyof typeof COURSE_STATUS];

// Batch Statuses
export const BATCH_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived'
} as const;

export type BatchStatus = typeof BATCH_STATUS[keyof typeof BATCH_STATUS];

// Test Submission Statuses
export const TEST_SUBMISSION_STATUS = {
    SUBMITTED: 'submitted',
    GRADED: 'graded'
} as const;

export type TestSubmissionStatus = typeof TEST_SUBMISSION_STATUS[keyof typeof TEST_SUBMISSION_STATUS];

// Question Types
export const QUESTION_TYPE = {
    MCQ: 'mcq',
    TEXT: 'text'
} as const;

export type QuestionType = typeof QUESTION_TYPE[keyof typeof QUESTION_TYPE];

// File Processing Statuses
export const FILE_PROCESSING_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
} as const;

export type FileProcessingStatus = typeof FILE_PROCESSING_STATUS[keyof typeof FILE_PROCESSING_STATUS];

// Progress Statuses
export const PROGRESS_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
} as const;

export type ProgressStatus = typeof PROGRESS_STATUS[keyof typeof PROGRESS_STATUS];

// Error Codes
export const ERROR_CODES = {
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Resource Errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

    // Business Logic
    COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
    BATCH_FULL: 'BATCH_FULL',
    ENROLLMENT_CLOSED: 'ENROLLMENT_CLOSED',
    TEST_ALREADY_SUBMITTED: 'TEST_ALREADY_SUBMITTED',

    // Server Errors
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
} as const;

// Pagination Defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    DEFAULT_SORT_ORDER: 'desc' as const
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.txt']
} as const;

// Date Formats
export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DATE_ONLY: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm'
} as const;

// Default Values
export const DEFAULTS = {
    PASSING_SCORE: 70,
    TEST_DURATION: 60, // minutes
    PASSWORD_EXPIRY_HOURS: 24,
    SESSION_TIMEOUT_MINUTES: 30
} as const;
