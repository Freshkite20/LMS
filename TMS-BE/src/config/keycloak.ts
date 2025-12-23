import jwt from 'jsonwebtoken';
import axios from 'axios';
import createError from 'http-errors';
import { config } from './env.js';
import logger from '../utils/logger.js';

// Cache for JWKS public keys
let publicKeyCache: string | null = null;
let publicKeyCacheExpiry: number = 0;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Keycloak Token Payload Interface
 */
export interface KeycloakTokenPayload {
  sub: string; // Subject (user ID)
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  exp: number;
  iat: number;
  iss: string;
  azp?: string; // Authorized party (client ID)
}

/**
 * Fetch public key from Keycloak JWKS endpoint
 */
async function fetchPublicKey(): Promise<string> {
  // Check cache first
  if (publicKeyCache && Date.now() < publicKeyCacheExpiry) {
    return publicKeyCache;
  }

  try {
    const { baseUrl, realm } = config.keycloak;

    if (!baseUrl || !realm) {
      logger.warn('Keycloak configuration incomplete, using development mode');
      return '';
    }

    const jwksUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/certs`;
    logger.debug(`Fetching JWKS from: ${jwksUrl}`);

    const response = await axios.get(jwksUrl, { timeout: 5000 });
    const keys = response.data.keys;

    if (!keys || keys.length === 0) {
      throw new Error('No keys found in JWKS response');
    }

    // Get the first key (or find the one with matching kid if needed)
    const key = keys[0];

    // Convert JWK to PEM format
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.x5c[0]}\n-----END PUBLIC KEY-----`;

    // Cache the key
    publicKeyCache = publicKey;
    publicKeyCacheExpiry = Date.now() + CACHE_TTL;

    logger.info('Successfully fetched and cached Keycloak public key');
    return publicKey;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to fetch Keycloak public key');

    // Fallback to environment variable
    const envKey = process.env.KEYCLOAK_PUBLIC_KEY;
    if (envKey) {
      logger.warn('Using KEYCLOAK_PUBLIC_KEY from environment');
      return envKey;
    }

    // In development, allow unverified tokens
    if (config.nodeEnv === 'development') {
      logger.warn('Development mode: Token verification disabled');
      return '';
    }

    throw new Error('Unable to fetch Keycloak public key');
  }
}

/**
 * Verify and decode Keycloak access token
 */
export async function verifyAccessToken(token: string): Promise<KeycloakTokenPayload> {
  try {
    const publicKey = await fetchPublicKey();

    if (!publicKey || config.nodeEnv === 'development') {
      // Development mode: decode without verification
      logger.warn('Decoding token without verification (development mode)');
      const decoded = jwt.decode(token, { json: true }) as KeycloakTokenPayload;

      if (!decoded) {
        throw createError(401, 'Invalid token format');
      }

      return decoded;
    }

    // Verify token with public key
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `${config.keycloak.baseUrl}/realms/${config.keycloak.realm}`,
    }) as KeycloakTokenPayload;

    logger.debug({ sub: decoded.sub, email: decoded.email }, 'Token verified successfully');
    return decoded;
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Token verification failed');

    if (error.name === 'TokenExpiredError') {
      throw createError(401, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw createError(401, 'Invalid token: ' + error.message);
    }
    if (error.name === 'NotBeforeError') {
      throw createError(401, 'Token not yet valid');
    }

    throw createError(401, `Token verification failed: ${error.message}`);
  }
}

/**
 * Extract roles from Keycloak token
 */
export function extractRoles(tokenPayload: KeycloakTokenPayload): string[] {
  const roles: Set<string> = new Set();

  // Extract realm roles
  if (tokenPayload.realm_access?.roles) {
    tokenPayload.realm_access.roles.forEach(role => roles.add(role));
  }

  // Extract client roles (resource_access)
  if (tokenPayload.resource_access) {
    Object.values(tokenPayload.resource_access).forEach(resource => {
      if (resource.roles) {
        resource.roles.forEach(role => roles.add(role));
      }
    });
  }

  // Extract client-specific roles
  const clientId = config.keycloak.clientId;
  if (clientId && tokenPayload.resource_access?.[clientId]?.roles) {
    tokenPayload.resource_access[clientId].roles.forEach(role => roles.add(role));
  }

  return Array.from(roles);
}

/**
 * Check if user has required role
 */
export function hasRole(tokenPayload: KeycloakTokenPayload, requiredRole: string): boolean {
  const userRoles = extractRoles(tokenPayload);
  return userRoles.includes(requiredRole);
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(tokenPayload: KeycloakTokenPayload, requiredRoles: string[]): boolean {
  const userRoles = extractRoles(tokenPayload);
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Get required roles for a specific path (RBAC)
 * This can be customized based on your application's needs
 */
export function getRequiredRolesForPath(method: string, path: string): string[] {
  const key = `${method.toUpperCase()} ${path}`;

  // Student-accessible endpoints
  const studentAllowed = [
    /^GET\s\/api\/students\/.+$/,
    /^GET\s\/api\/courses\/.+$/,
    /^GET\s\/api\/progress\/.+$/,
    /^POST\s\/api\/progress$/,
    /^POST\s\/api\/tests\/.+\/submit$/,
    /^GET\s\/api\/tests\/.+\/submissions\/.+$/,
  ];

  // Teacher-accessible endpoints
  const teacherAllowed = [
    /^GET\s\/api\/courses$/,
    /^GET\s\/api\/courses\/.+$/,
    /^GET\s\/api\/batches\/.+\/progress$/,
    /^GET\s\/api\/tests\/.+$/,
  ];

  // Check if student can access
  if (studentAllowed.some(pattern => pattern.test(key))) {
    return ['student', 'teacher', 'admin'];
  }

  // Check if teacher can access
  if (teacherAllowed.some(pattern => pattern.test(key))) {
    return ['teacher', 'admin'];
  }

  // Default: admin only
  return ['admin'];
}

/**
 * Refresh Keycloak token
 */
export async function refreshToken(refreshToken: string): Promise<any> {
  try {
    const { baseUrl, realm, clientId, clientSecret } = config.keycloak;
    const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);

    const response = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Token refresh failed');
    throw createError(401, 'Failed to refresh token');
  }
}

/**
 * Get user info from Keycloak
 */
export async function getUserInfo(accessToken: string): Promise<any> {
  try {
    const { baseUrl, realm } = config.keycloak;
    const userInfoUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/userinfo`;

    const response = await axios.get(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.data;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to fetch user info');
    throw createError(401, 'Failed to fetch user info');
  }
}

/**
 * Logout user from Keycloak
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  try {
    const { baseUrl, realm, clientId, clientSecret } = config.keycloak;
    const logoutUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/logout`;

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);

    await axios.post(logoutUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    logger.info('User logged out successfully');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Logout failed');
    throw createError(500, 'Failed to logout');
  }
}


