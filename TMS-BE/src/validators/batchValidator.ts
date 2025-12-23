import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Batch Validation Schemas
 */

export const createBatchValidation: ValidationChain[] = [
    body('batchCode')
        .trim()
        .notEmpty()
        .withMessage('Batch code is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Batch code must be between 2 and 50 characters'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Batch name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Batch name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    body('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
];

export const updateBatchValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid batch ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Batch name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    body('status')
        .optional()
        .isIn(['active', 'archived'])
        .withMessage('Status must be active or archived'),
];

export const getBatchValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid batch ID'),
];

export const enrollStudentValidation: ValidationChain[] = [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number'),
    body('batchId')
        .isUUID()
        .withMessage('Valid batch ID is required'),
];
