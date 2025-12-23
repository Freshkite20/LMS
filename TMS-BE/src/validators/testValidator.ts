import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Test Validation Schemas
 */

export const createTestValidation: ValidationChain[] = [
    body('courseId')
        .isUUID()
        .withMessage('Valid course ID is required'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Test title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('duration')
        .isInt({ min: 1 })
        .withMessage('Duration must be a positive integer (in minutes)'),
    body('passingScore')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),
];

export const getTestValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid test ID'),
    query('includeQuestions')
        .optional()
        .isBoolean()
        .withMessage('includeQuestions must be a boolean'),
];

export const submitTestValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid test ID'),
    body('studentId')
        .isUUID()
        .withMessage('Valid student ID is required'),
    body('answers')
        .isArray({ min: 1 })
        .withMessage('At least one answer is required'),
    body('answers.*.questionId')
        .isUUID()
        .withMessage('Each answer must have a valid question ID'),
    body('answers.*.answerText')
        .trim()
        .notEmpty()
        .withMessage('Each answer must have answer text'),
];

export const getSubmissionValidation: ValidationChain[] = [
    param('testId')
        .isUUID()
        .withMessage('Invalid test ID'),
    param('submissionId')
        .isUUID()
        .withMessage('Invalid submission ID'),
];

export const uploadQuestionsValidation: ValidationChain[] = [
    param('id')
        .isUUID()
        .withMessage('Invalid test ID'),
];
