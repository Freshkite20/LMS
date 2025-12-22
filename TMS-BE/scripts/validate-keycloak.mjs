/**
 * Keycloak Configuration Validation Script
 * Tests Keycloak connectivity and configuration
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

function logWarning(message) {
    log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ ${message}`, colors.blue);
}

async function validateKeycloakSetup() {
    log('\n' + '='.repeat(60), colors.bold);
    log('KEYCLOAK CONFIGURATION VALIDATION', colors.bold);
    log('='.repeat(60) + '\n', colors.bold);

    let hasErrors = false;
    let hasWarnings = false;

    // 1. Check environment variables
    log('1. Checking Environment Variables...', colors.bold);

    const requiredVars = {
        KEYCLOAK_BASE_URL: process.env.KEYCLOAK_BASE_URL,
        KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,
        KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
        KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET
    };

    for (const [key, value] of Object.entries(requiredVars)) {
        if (!value) {
            logError(`${key} is not set`);
            hasErrors = true;
        } else {
            // Mask sensitive values
            const displayValue = key.includes('SECRET')
                ? '*'.repeat(value.length)
                : value;
            logSuccess(`${key} = ${displayValue}`);
        }
    }

    if (hasErrors) {
        log('\n' + '='.repeat(60), colors.bold);
        logError('VALIDATION FAILED: Missing required environment variables');
        log('='.repeat(60) + '\n', colors.bold);
        process.exit(1);
    }

    // 2. Test Keycloak connectivity
    log('\n2. Testing Keycloak Connectivity...', colors.bold);

    const baseUrl = process.env.KEYCLOAK_BASE_URL;
    const realm = process.env.KEYCLOAK_REALM;

    try {
        // Test base URL
        logInfo(`Testing connection to: ${baseUrl}`);
        const healthResponse = await axios.get(baseUrl, { timeout: 5000 });
        logSuccess(`Keycloak server is reachable (Status: ${healthResponse.status})`);
    } catch (error) {
        logError(`Cannot connect to Keycloak server: ${error.message}`);
        hasErrors = true;
    }

    // 3. Test realm configuration
    log('\n3. Testing Realm Configuration...', colors.bold);

    try {
        const realmUrl = `${baseUrl}/realms/${realm}`;
        logInfo(`Testing realm: ${realmUrl}`);
        const realmResponse = await axios.get(realmUrl, { timeout: 5000 });
        logSuccess(`Realm '${realm}' is accessible`);
        logInfo(`Realm: ${realmResponse.data.realm}`);
        logInfo(`Public Key: ${realmResponse.data.public_key ? 'Available' : 'Not found'}`);
    } catch (error) {
        logError(`Cannot access realm '${realm}': ${error.message}`);
        hasErrors = true;
    }

    // 4. Test JWKS endpoint
    log('\n4. Testing JWKS Endpoint...', colors.bold);

    try {
        const jwksUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/certs`;
        logInfo(`Testing JWKS endpoint: ${jwksUrl}`);
        const jwksResponse = await axios.get(jwksUrl, { timeout: 5000 });

        if (jwksResponse.data.keys && jwksResponse.data.keys.length > 0) {
            logSuccess(`JWKS endpoint is accessible`);
            logInfo(`Found ${jwksResponse.data.keys.length} key(s)`);

            jwksResponse.data.keys.forEach((key, index) => {
                logInfo(`  Key ${index + 1}: ${key.kid} (${key.alg})`);
            });
        } else {
            logWarning('JWKS endpoint returned no keys');
            hasWarnings = true;
        }
    } catch (error) {
        logError(`Cannot access JWKS endpoint: ${error.message}`);
        hasErrors = true;
    }

    // 5. Test OpenID configuration
    log('\n5. Testing OpenID Configuration...', colors.bold);

    try {
        const openidUrl = `${baseUrl}/realms/${realm}/.well-known/openid-configuration`;
        logInfo(`Testing OpenID config: ${openidUrl}`);
        const openidResponse = await axios.get(openidUrl, { timeout: 5000 });

        logSuccess('OpenID configuration is accessible');
        logInfo(`Issuer: ${openidResponse.data.issuer}`);
        logInfo(`Token endpoint: ${openidResponse.data.token_endpoint}`);
        logInfo(`Userinfo endpoint: ${openidResponse.data.userinfo_endpoint}`);
        logInfo(`Logout endpoint: ${openidResponse.data.end_session_endpoint}`);
    } catch (error) {
        logError(`Cannot access OpenID configuration: ${error.message}`);
        hasErrors = true;
    }

    // 6. Test client credentials (optional - requires client secret)
    log('\n6. Testing Client Configuration...', colors.bold);

    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (clientId && clientSecret) {
        try {
            const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
            logInfo(`Testing client credentials grant...`);

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);

            const tokenResponse = await axios.post(tokenUrl, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 5000
            });

            if (tokenResponse.data.access_token) {
                logSuccess('Client credentials are valid');
                logInfo(`Token type: ${tokenResponse.data.token_type}`);
                logInfo(`Expires in: ${tokenResponse.data.expires_in} seconds`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                logError('Client credentials are invalid (401 Unauthorized)');
                logError('Please check KEYCLOAK_CLIENT_ID and KEYCLOAK_CLIENT_SECRET');
                hasErrors = true;
            } else if (error.response?.status === 400) {
                logWarning('Client may not support client_credentials grant type');
                logInfo('This is OK if you are using authorization_code or password grant');
                hasWarnings = true;
            } else {
                logError(`Client credentials test failed: ${error.message}`);
                hasErrors = true;
            }
        }
    } else {
        logWarning('Client secret not provided, skipping client credentials test');
        hasWarnings = true;
    }

    // Final summary
    log('\n' + '='.repeat(60), colors.bold);

    if (hasErrors) {
        logError('VALIDATION FAILED: Keycloak setup has errors');
        log('\nPlease fix the errors above and try again.', colors.yellow);
    } else if (hasWarnings) {
        logWarning('VALIDATION COMPLETED WITH WARNINGS');
        log('\nKeycloak is configured but there are some warnings.', colors.yellow);
    } else {
        logSuccess('VALIDATION SUCCESSFUL: Keycloak is properly configured!');
        log('\nYour application should be able to authenticate users with Keycloak.', colors.green);
    }

    log('='.repeat(60) + '\n', colors.bold);

    process.exit(hasErrors ? 1 : 0);
}

// Run validation
validateKeycloakSetup().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
