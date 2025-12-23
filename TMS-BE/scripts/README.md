# Scripts Directory

This directory contains utility scripts for development, testing, and deployment tasks.

## Available Scripts

### 1. clean-build.mjs
**Purpose**: Clean build artifacts and rebuild the project from scratch.

**Usage**:
```bash
npm run build:clean
```

**What it does**:
- Removes the `dist` folder
- Runs a fresh TypeScript compilation
- Ensures no stale build artifacts remain

**When to use**:
- After major refactoring
- When experiencing build issues
- Before deployment to ensure clean build

---

### 2. validate-env.mjs
**Purpose**: Validate environment configuration before running the application.

**Usage**:
```bash
npm run validate:env
```

**What it does**:
- Checks for `.env` file existence
- Validates all required environment variables
- Checks recommended optional variables
- Validates format of specific values (MongoDB URI, PORT, etc.)

**When to use**:
- Before first run
- After updating `.env` file
- When troubleshooting configuration issues
- In CI/CD pipelines

---

### 3. seed-db.mjs
**Purpose**: Populate the database with initial development/testing data.

**Usage**:
```bash
npm run seed:db
```

**What it does**:
- Connects to MongoDB
- Clears existing data (optional - can be commented out)
- Creates sample users (admin, teacher, student)
- Creates sample courses
- Creates sample batches

**When to use**:
- Setting up development environment
- Resetting database to known state
- Creating test data for manual testing

**⚠️ Warning**: This script will clear existing data by default. Comment out the deletion lines if you want to preserve existing data.

---

## Adding New Scripts

When adding new scripts to this directory:

1. **Use `.mjs` extension** for ES modules
2. **Add shebang** at the top: `#!/usr/bin/env node`
3. **Add to package.json** scripts section
4. **Document here** with purpose and usage
5. **Use descriptive names** like `action-target.mjs`
6. **Include error handling** and user-friendly messages
7. **Use emoji** for visual feedback (✅ ❌ ⚠️ 🎉)

## Script Naming Convention

- `clean-*.mjs` - Cleanup operations
- `validate-*.mjs` - Validation operations
- `seed-*.mjs` - Data seeding operations
- `deploy-*.mjs` - Deployment operations
- `test-*.mjs` - Testing utilities

## Common Patterns

### Loading Environment Variables
```javascript
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '..', '.env') });
```

### Connecting to Database
```javascript
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
// ... do work
await mongoose.disconnect();
```

### Running Shell Commands
```javascript
import { execSync } from 'child_process';

execSync('npm run build', { stdio: 'inherit' });
```

## Troubleshooting

### Script won't run
- Ensure Node.js is installed
- Check file permissions (may need `chmod +x` on Unix systems)
- Verify the script is listed in `package.json`

### Environment variables not loading
- Check `.env` file exists in project root
- Verify path in `dotenv.config()`
- Ensure no syntax errors in `.env` file

### Database connection fails
- Verify MongoDB is running
- Check `MONGODB_URI` in `.env`
- Ensure network connectivity
