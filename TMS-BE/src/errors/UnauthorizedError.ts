import { AppError } from './AppError.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

/**
 * Unauthorized Error
 * Thrown when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required', details?: any) {
        super(
            message,
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            true,
            details
        );

        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}
