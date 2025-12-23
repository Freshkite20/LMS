import rateLimit from 'express-rate-limit';
import { config } from './env.js';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests from this IP' }
  }
});


