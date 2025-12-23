# Installing Jest for Testing

## Problem
The TypeScript error "Cannot find name 'jest'" occurs because Jest is not installed in the project.

## Solution Steps

### Step 1: Enable PowerShell Script Execution (if needed)
If you encounter a PowerShell execution policy error, run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 2: Install Jest Dependencies
Run the following command in the TMS-BE directory:

```bash
npm install --save-dev jest @types/jest ts-jest
```

This installs:
- **jest**: The testing framework
- **@types/jest**: TypeScript type definitions for Jest
- **ts-jest**: TypeScript preprocessor for Jest

### Step 3: Verify Installation
After installation, the TypeScript errors should disappear. You can verify by running:

```bash
npm test
```

## What Was Already Configured

I've already created the following files for you:

1. **jest.config.js** - Jest configuration with TypeScript and ESM support
2. **tsconfig.test.json** - TypeScript configuration for tests (includes Jest types)
3. **tests/setup.ts** - Global test setup file
4. **package.json** - Updated with test scripts:
   - `npm test` - Run all tests
   - `npm run test:watch` - Run tests in watch mode
   - `npm run test:coverage` - Run tests with coverage report

## Alternative: Using CMD Instead of PowerShell

If you prefer, you can use Command Prompt (CMD) instead of PowerShell:

1. Open Command Prompt
2. Navigate to the project directory
3. Run: `npm install --save-dev jest @types/jest ts-jest`

## After Installation

Once Jest is installed, the following will work:
- TypeScript will recognize `jest.fn()` and other Jest globals
- You can run tests using `npm test`
- The test fixtures in `tests/fixtures/testData.ts` will work correctly
