import { AppError } from './AppError.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

/**
 * Validation Error
 * Thrown when request validation fails
 */
export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: any) {
        super(
            message,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            true,
            details
        );

        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
