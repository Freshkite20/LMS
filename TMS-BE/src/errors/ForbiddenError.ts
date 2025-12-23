import { AppError } from './AppError.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

/**
 * Forbidden Error
 * Thrown when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden', details?: any) {
        super(
            message,
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.FORBIDDEN,
            true,
            details
        );

        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
