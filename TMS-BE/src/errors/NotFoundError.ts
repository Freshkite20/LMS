import { AppError } from './AppError.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

/**
 * Not Found Error
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', details?: any) {
        super(
            `${resource} not found`,
            HTTP_STATUS.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            true,
            details
        );

        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
