import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

/**
 * Base Application Error Class
 * All custom errors should extend this class
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
        isOperational: boolean = true,
        details?: any
    ) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly
        Object.setPrototypeOf(this, AppError.prototype);
    }

    toJSON() {
        return {
            success: false,
            error: this.code,
            message: this.message,
            statusCode: this.statusCode,
            ...(this.details && { details: this.details })
        };
    }
}
