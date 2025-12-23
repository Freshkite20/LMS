import pino from 'pino';
import { config } from '../config/env.js';

/**
 * Centralized Logger using Pino
 * Provides structured logging across the application
 */

const isDevelopment = config.NODE_ENV === 'development';

export const logger = pino({
    level: config.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: Record<string, any>) => {
    return logger.child(context);
};

/**
 * Log levels:
 * - trace: Very detailed information, typically only for diagnosing problems
 * - debug: Detailed information for debugging
 * - info: General informational messages
 * - warn: Warning messages for potentially harmful situations
 * - error: Error messages for error events
 * - fatal: Critical errors that cause application termination
 */

export default logger;

