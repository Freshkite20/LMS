import { body, param, query, ValidationChain } from 'express-validator';

/**
 * User Validation Schemas
 */

export const createUserValidation: ValidationChain[] = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
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
    body('role')
        .isIn(['admin', 'teacher', 'student'])
        .withMessage('Role must be admin, teacher, or student'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number'),
];

export const updateUserValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid user ID'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number'),
];

export const getUserValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid user ID'),
];
