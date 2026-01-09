/**
 * Simple Logger wrapper using console
 * Maintains the same interface as the previous Pino logger
 */

export const logger = {
    info: (...args: any[]) => console.log('[INFO]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args),
    warn: (...args: any[]) => console.warn('[WARN]', ...args),
    debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
    trace: (...args: any[]) => console.trace('[TRACE]', ...args),
    fatal: (...args: any[]) => console.error('[FATAL]', ...args),
    child: () => logger,
};

export const createLogger = (context: Record<string, any>) => {
    console.log('[LOGGER CREATED]', context);
    return logger;
};

export default logger;
