import { AppError } from './AppError.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

/**
 * Conflict Error
 * Thrown when a resource already exists or there's a conflict
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists', details?: any) {
        super(
            message,
            HTTP_STATUS.CONFLICT,
            ERROR_CODES.ALREADY_EXISTS,
            true,
            details
        );

        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
