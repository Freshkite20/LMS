/**
 * Fix Student User Script
 * Attempts to fix the "Account is not fully set up" error for student@example.com
 */

import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, colors.green);
}

function logError(message) {
    log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ ${message}`, colors.blue);
}

async function fixStudentUser() {
    log('\n' + '='.repeat(60), colors.bold);
    log('FIXING STUDENT USER ACCOUNT', colors.bold);
    log('='.repeat(60) + '\n', colors.bold);

    const baseUrl = process.env.KEYCLOAK_BASE_URL;
    const realm = process.env.KEYCLOAK_REALM;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    const targetUsername = 'student@example.com';
    const targetPassword = 'std123';

    if (!baseUrl || !realm || !clientId || !clientSecret) {
        logError('Missing required environment variables (KEYCLOAK_BASE_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET)');
        process.exit(1);
    }

    try {
        // 1. Get Access Token (Client Credentials)
        logInfo('1. Authenticating as Service Account...');
        const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const tokenResponse = await axios.post(tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;
        logSuccess('Authenticated successfully');

        // 2. Find the user
        logInfo(`\n2. Searching for user: ${targetUsername}...`);
        const adminUsersUrl = `${baseUrl}/admin/realms/${realm}/users`;
        const userSearchResponse = await axios.get(adminUsersUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { username: targetUsername, exact: true }
        });

        const users = userSearchResponse.data;
        if (users.length === 0) {
            logError(`User '${targetUsername}' not found in Keycloak.`);
            logInfo('Please create the user first or check the username.');
            process.exit(1);
        }

        const user = users[0];
        logSuccess(`Found user: ${user.id}`);

        // 3. Clear Required Actions
        logInfo('\n3. Clearing Required Actions...');
        const userUrl = `${adminUsersUrl}/${user.id}`;

        // Update user to clear required actions and ensure enabled
        await axios.put(userUrl, {
            requiredActions: [],
            enabled: true,
            emailVerified: true
        }, {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        logSuccess('Required actions cleared and user enabled');

        // 4. Reset Password (to remove temporary status)
        logInfo('\n4. Resetting password (removing temporary status)...');
        const resetPasswordUrl = `${userUrl}/reset-password`;
        await axios.put(resetPasswordUrl, {
            type: 'password',
            value: targetPassword,
            temporary: false
        }, {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        logSuccess(`Password reset to '${targetPassword}' and marked as permanent`);

        log('\n' + '='.repeat(60), colors.bold);
        logSuccess('SUCCESS: User account fixed!');
        logInfo(`You should now be able to login with '${targetUsername}'`);
        log('='.repeat(60) + '\n', colors.bold);

    } catch (error) {
        log('\n' + '='.repeat(60), colors.bold);
        logError('OPERATION FAILED');

        if (error.response) {
            logError(`Status: ${error.response.status} - ${error.response.statusText}`);
            if (error.response.status === 403) {
                logError('Permission Denied: The client service account likely does not have "manage-users" role.');
                logInfo('Explanation: The "tms-backend" client needs "realm-management" -> "manage-users" role assigned in Keycloak Service Account Roles.');
            }
            if (error.response.data) {
                logInfo(`Details: ${JSON.stringify(error.response.data)}`);
            }
        } else {
            logError(error.message);
        }
        log('='.repeat(60) + '\n', colors.bold);
        process.exit(1);
    }
}

fixStudentUser();
