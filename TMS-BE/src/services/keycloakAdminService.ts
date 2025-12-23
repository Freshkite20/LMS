import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import createError from 'http-errors';

export class KeycloakAdminService {
    private static async getAdminAccessToken(): Promise<string> {
        try {
            const { baseUrl, realm, clientId, clientSecret } = config.keycloak;
            const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);

            const response = await axios.post(tokenUrl, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            return response.data.access_token;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to get Keycloak admin access token');
            throw createError(500, 'Keycloak admin authentication failed');
        }
    }

    static async createUser(userData: {
        email: string;
        firstName: string;
        lastName: string;
        password?: string;
        username?: string;
    }): Promise<string> {
        try {
            const token = await this.getAdminAccessToken();
            const { baseUrl, realm } = config.keycloak;
            const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

            const userPayload = {
                username: userData.username || userData.email,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                enabled: true,
                emailVerified: true, // Assuming auto-verified for now
                credentials: userData.password ? [{
                    type: 'password',
                    value: userData.password,
                    temporary: true
                }] : []
            };

            const createResponse = await axios.post(usersUrl, userPayload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Keycloak returns 201 Created with Location header containing the ID
            const locationHeader = createResponse.headers['location'];
            if (locationHeader) {
                const parts = locationHeader.split('/');
                return parts[parts.length - 1];
            }

            // Fallback: If no Location header (unlikely), search for the user
            const searchUrl = `${usersUrl}?email=${userData.email}`;
            const searchResponse = await axios.get(searchUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const user = searchResponse.data.find((u: any) => u.username === (userData.username || userData.email));
            if (user) return user.id;

            throw new Error('User created but ID could not be retrieved');

        } catch (error: any) {
            logger.error({ error: error.message, response: error.response?.data }, 'Failed to create Keycloak user');

            if (error.response?.status === 409) {
                throw createError(409, 'User already exists in Keycloak');
            }

            throw createError(500, `Failed to create user in Keycloak: ${error.message}`);
        }
    }
}
