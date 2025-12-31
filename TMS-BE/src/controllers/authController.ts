import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import createError from 'http-errors';
import { UsersRepository } from '../repositories/userRepository.js';

export class AuthController {
    /**
     * Register a new user
     */
    static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { firstName, lastName, email, password } = req.body;

            if (!email || !password || !firstName || !lastName) {
                throw createError(400, 'All fields are required');
            }

            // Check if user exists in local DB
            const existingUser = await UsersRepository.getByEmail(email);
            if (existingUser) {
                throw createError(409, 'User already exists');
            }

            const { baseUrl, realm, clientId, clientSecret } = config.keycloak;

            // 1. Get Admin Token (Service Account)
            const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
            const tokenParams = new URLSearchParams();
            tokenParams.append('grant_type', 'client_credentials');
            tokenParams.append('client_id', clientId);
            tokenParams.append('client_secret', clientSecret);

            let adminToken;
            try {
                const tokenResponse = await axios.post(tokenUrl, tokenParams, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                console.log(tokenResponse);
                
                adminToken = tokenResponse.data.access_token;
            } catch (error: any) {
                console.error('Keycloak Admin Token Error:', error.response?.data || error.message);
                throw createError(500, 'Failed to authenticate with Keycloak Admin API. Check authentication service configuration.');
            }

            // 2. Create User in Keycloak
            const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;
            const userPayload = {
                username: email, // Use email as username
                email: email,
                firstName: firstName,
                lastName: lastName,
                enabled: true,
                credentials: [{
                    type: 'password',
                    value: password,
                    temporary: false
                }]
            };

            let keycloakId;
            try {
                const createResponse = await axios.post(usersUrl, userPayload, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Get the location header to find the ID or search for it
                if (createResponse.headers.location) {
                    const parts = createResponse.headers.location.split('/');
                    keycloakId = parts[parts.length - 1];
                } else {
                    // Fallback: search by email
                    const searchUrl = `${usersUrl}?email=${email}`;
                    const searchResponse = await axios.get(searchUrl, {
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });
                    if (searchResponse.data && searchResponse.data.length > 0) {
                        keycloakId = searchResponse.data[0].id;
                    }
                }
            } catch (error: any) {
                // If 409, user exists in Keycloak
                if (error.response && error.response.status === 409) {
                    throw createError(409, 'User already exists');
                }
                if (error.response && error.response.status === 403) {
                    console.error('Keycloak Permission Error:', error.response?.data);
                    throw createError(500, 'Keycloak Service Account lacks permissions. Ensure "manage-users" role is assigned to the client service account.');
                }
                console.error('Keycloak User Creation Error:', error.response?.data || error.message);
                throw error;
            }

            if (!keycloakId) {
                throw createError(500, 'Failed to retrieve Keycloak user ID');
            }

            // 3. Create User in Local DB
            const user = await UsersRepository.create({
                keycloak_id: keycloakId,
                email,
                first_name: firstName,
                last_name: lastName,
                role: 'student', // Default role for signup
                phone: null
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    userId: user.id
                }
            });

        } catch (err) {
            next(err);
        }
    }

    /**
     * Login with username and password
     * Proxies the request to Keycloak's token endpoint and syncs user to local DB
     */
    /**
     * Login with username and password
     * Proxies the request to Keycloak's token endpoint and syncs user to local DB
     */
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        const startTime = Date.now();
        console.log(`[Auth] Login attempt for username: ${req.body.username}`);

        try {
            const { username, password } = req.body;

            if (!username || !password) {
                throw createError(400, 'Username and password are required');
            }

            const { baseUrl, realm, clientId, clientSecret } = config.keycloak;

            // 1. Authenticate with Keycloak
            const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('username', username);
            params.append('password', password);
            params.append('scope', 'openid profile email');

            let tokenResponse;
            console.log('[Auth] Requesting Keycloak token...');
            const tokenStart = Date.now();

            try {
                const response = await axios.post(tokenUrl, params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
                console.log("res",response)
                tokenResponse = response.data;
                console.log(`[Auth] Token received in ${Date.now() - tokenStart}ms`);
            } catch (error: any) {
                console.error('[Auth] Keycloak token request failed:', error.message);
                if (error.response) {
                    throw createError(error.response.status, error.response.data.error_description || 'Authentication failed');
                }
                throw error;
            }

            // 2. Decode Token to get User Info & Roles
            const decodedToken: any = jwt.decode(tokenResponse.access_token);
            if (!decodedToken) {
                throw createError(500, 'Invalid token received from provider');
            }

            let role: 'student' | 'admin' = 'student';

            // Check for admin role
            if (decodedToken?.realm_access?.roles?.includes('admin') ||
                decodedToken?.realm_access?.roles?.includes('realm-admin') ||
                decodedToken?.resource_access?.['realm-management']?.roles?.includes('manage-users')) {
                role = 'admin';
            }

            // Extract user info from token directly
            const email = decodedToken.email;
            const firstName = decodedToken.given_name || 'User';
            const lastName = decodedToken.family_name || '';
            const keycloakId = decodedToken.sub;

            console.log(`[Auth] Processed token for user: ${email}, Role: ${role}`);

            // 3. Sync/Get User from Local DB
            const dbStart = Date.now();
            let user = await UsersRepository.getByEmail(email);
            console.log("user:",user);
            

            if (!user) {
                // Auto-create user if missing (JIT provisioning)
                console.log(`[Auth] User ${email} not found locally. Auto-creating...`);

                // If token missed details, fallback to userinfo (rare)
                if (!email) {
                    console.log('[Auth] Email missing in token, fetching userinfo...');
                    const userInfoUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
                    const uiRes = await axios.get(userInfoUrl, {
                        headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` },
                    });
                    // Re-assign vars from userinfo if needed, but for now we assume token has it as per scope
                    if (!uiRes.data.email) throw createError(500, 'Email not provided by identity provider');
                }

                user = await UsersRepository.create({
                    keycloak_id: keycloakId,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                    phone: null
                });
            } else {
                // Update role if changed
                if (user.role !== role) {
                    console.log(`[Auth] Updating role for ${email}`);
                    const updatedUser = await UsersRepository.updateRole(user.id, role);
                    if (updatedUser) user = updatedUser;
                }
            }
            console.log(`[Auth] DB sync completed in ${Date.now() - dbStart}ms`);

            // 4. Return Response
            console.log(`[Auth] Login successful. Total time: ${Date.now() - startTime}ms`);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    expiresIn: tokenResponse.expires_in,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`.trim(),
                        role: user.role
                    }
                }
            });

        } catch (err) {
            console.error('[Auth] Login error:', err);
            next(err);
        }
    }

    /**
     * Refresh access token
     */
    static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError(400, 'RefreshToken is required');

            const { baseUrl, realm, clientId, clientSecret } = config.keycloak;
            const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('refresh_token', refreshToken);

            try {
                const response = await axios.post(tokenUrl, params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });

                res.json({
                    success: true,
                    data: response.data,
                    message: 'Token refreshed successfully'
                });
            } catch (error: any) {
                if (error.response) {
                    throw createError(error.response.status, error.response.data.error_description || 'Refresh failed');
                }
                throw error;
            }
        } catch (err) {
            next(err);
        }
    }
}
