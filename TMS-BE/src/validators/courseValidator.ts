import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Course Validation Schemas
 */

export const createCourseValidation: ValidationChain[] = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Course title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Category must not exceed 100 characters'),
    body('templateType')
        .notEmpty()
        .withMessage('Template type is required'),
    body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    body('estimatedDuration')
        .optional()
        .trim(),
];

export const updateCourseValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid course ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Status must be draft, published, or archived'),
];

export const getCourseValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid course ID'),
    query('includeSections')
        .optional()
        .isBoolean()
        .withMessage('includeSections must be a boolean'),
];

export const addSectionValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid course ID'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Section title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('content')
        .optional()
        .trim(),
    body('videoUrl')
        .optional()
        .isURL()
        .withMessage('Invalid video URL'),
    body('orderIndex')
        .isInt({ min: 0 })
        .withMessage('Order index must be a non-negative integer'),
    body('duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Duration must be a positive integer'),
];

export const assignCourseValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid course ID'),
    body('assignmentType')
        .isIn(['individual', 'batch'])
        .withMessage('Assignment type must be individual or batch'),
    body('studentIds')
        .if(body('assignmentType').equals('individual'))
        .isArray({ min: 1 })
        .withMessage('At least one student ID is required for individual assignment'),
    body('batchIds')
        .if(body('assignmentType').equals('batch'))
        .isArray({ min: 1 })
        .withMessage('At least one batch ID is required for batch assignment'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid ISO 8601 date'),
];
