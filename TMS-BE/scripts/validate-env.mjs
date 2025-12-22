#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are set
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, '.env');

console.log('🔍 Validating environment configuration...\n');

// Check if .env file exists
if (!existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('ℹ️  Please create a .env file in the project root');
    process.exit(1);
}

// Load environment variables
dotenv.config({ path: envPath });

// Required environment variables
const requiredVars = [
    'MONGODB_URI',
    'PORT',
    'JWT_SECRET',
    'NODE_ENV',
];

// Optional but recommended variables
const recommendedVars = [
    'KEYCLOAK_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_CLIENT_ID',
    'CORS_ORIGIN',
];

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach((varName) => {
    if (process.env[varName]) {
        console.log(`  ✅ ${varName}`);
    } else {
        console.log(`  ❌ ${varName} - MISSING`);
        hasErrors = true;
    }
});

// Check recommended variables
console.log('\n📋 Recommended Variables:');
recommendedVars.forEach((varName) => {
    if (process.env[varName]) {
        console.log(`  ✅ ${varName}`);
    } else {
        console.log(`  ⚠️  ${varName} - Not set (optional)`);
        hasWarnings = true;
    }
});

// Validate specific values
console.log('\n🔍 Validating Values:');

// Check MongoDB URI format
if (process.env.MONGODB_URI) {
    if (process.env.MONGODB_URI.startsWith('mongodb://') ||
        process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
        console.log('  ✅ MONGODB_URI format is valid');
    } else {
        console.log('  ❌ MONGODB_URI format is invalid');
        hasErrors = true;
    }
}

// Check PORT is a number
if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        console.log('  ❌ PORT must be a valid number between 1 and 65535');
        hasErrors = true;
    } else {
        console.log(`  ✅ PORT is valid (${port})`);
    }
}

// Check NODE_ENV value
if (process.env.NODE_ENV) {
    const validEnvs = ['development', 'production', 'test'];
    if (validEnvs.includes(process.env.NODE_ENV)) {
        console.log(`  ✅ NODE_ENV is valid (${process.env.NODE_ENV})`);
    } else {
        console.log(`  ⚠️  NODE_ENV should be one of: ${validEnvs.join(', ')}`);
        hasWarnings = true;
    }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('Please fix the errors above before running the application');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  Environment validation passed with warnings');
    console.log('Consider setting the recommended variables for full functionality');
    process.exit(0);
} else {
    console.log('✅ Environment validation PASSED');
    console.log('All required variables are properly configured');
    process.exit(0);
}
