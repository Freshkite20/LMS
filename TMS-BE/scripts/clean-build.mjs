#!/usr/bin/env node

/**
 * Clean Build Script
 * Removes the dist folder and rebuilds the project
 */

import { rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

console.log('🧹 Cleaning build artifacts...');

// Remove dist folder if it exists
if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Removed dist folder');
} else {
    console.log('ℹ️  No dist folder to remove');
}

console.log('\n📦 Building project...');

try {
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
    console.log('\n✅ Build completed successfully!');
} catch (error) {
    console.error('\n❌ Build failed!');
    process.exit(1);
}
