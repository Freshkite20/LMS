import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import {
  verifyAccessToken,
  extractRoles,
  hasAnyRole,
  getRequiredRolesForPath,
  KeycloakTokenPayload
} from '../config/keycloak.js';
import logger from '../utils/logger.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: KeycloakTokenPayload;
    userRoles?: string[];
  }
}

/**
 * Authentication Middleware
 * Verifies the JWT token from Keycloak and attaches user info to request
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Missing Authorization header');
    return next(createError(401, 'Missing Authorization header'));
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Invalid Authorization header format');
    return next(createError(401, 'Invalid Authorization header format'));
  }

  const token = parts[1];

  // Verify token asynchronously
  verifyAccessToken(token)
    .then((decoded) => {
      req.user = decoded;
      req.userRoles = extractRoles(decoded);

      logger.debug({
        userId: decoded.sub,
        email: decoded.email,
        roles: req.userRoles
      }, 'User authenticated');

      next();
    })
    .catch((error) => {
      logger.warn({ error: error.message }, 'Authentication failed');
      next(error);
    });
}

/**
 * Authorization Middleware
 * Checks if the authenticated user has the required roles
 */
export function authorize(requiredRoles?: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Authorization check failed: No user in request');
      return next(createError(401, 'Authentication required'));
    }

    // Get roles to check
    const rolesToCheck = requiredRoles && requiredRoles.length > 0
      ? requiredRoles
      : getRequiredRolesForPath(req.method, req.path);

    // Check if user has any of the required roles
    const allowed = hasAnyRole(req.user, rolesToCheck);

    if (!allowed) {
      logger.warn({
        userId: req.user.sub,
        userRoles: req.userRoles,
        requiredRoles: rolesToCheck
      }, 'Authorization failed: Insufficient permissions');

      return next(createError(403, 'Forbidden: Insufficient permissions'));
    }

    logger.debug({
      userId: req.user.sub,
      roles: req.userRoles
    }, 'User authorized');

    next();
  };
}

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No token provided, continue without authentication
    return next();
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // Invalid format, continue without authentication
    return next();
  }

  const token = parts[1];

  // Try to verify token
  verifyAccessToken(token)
    .then((decoded) => {
      req.user = decoded;
      req.userRoles = extractRoles(decoded);
      next();
    })
    .catch(() => {
      // Token verification failed, continue without authentication
      next();
    });
}

/**
 * Role-specific middleware helpers
 */  
export const requireAdmin = authorize(['admin']);
export const requireTeacher = authorize(['teacher', 'admin']);
export const requireStudent = authorize(['student', 'teacher', 'admin']);


