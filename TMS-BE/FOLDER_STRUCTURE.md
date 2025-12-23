# TMS Backend - Folder Structure

This document describes the organized folder structure of the TMS (Training Management System) backend application.

## Overview

The project follows a clean, layered architecture pattern that separates concerns and makes the codebase maintainable and scalable.

```
TMS-BE/
├── src/
│   ├── config/          # Configuration files
│   ├── db/              # Database connection
│   ├── models/          # Mongoose schemas/models
│   ├── repositories/    # Data Access Layer (DAL)
│   ├── services/        # Business Logic Layer
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Express middlewares
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── app.ts           # Express app configuration
│   └── index.ts         # Application entry point
├── db/                  # Database scripts/migrations
├── scripts/             # Build and utility scripts
├── uploads/             # File upload storage
├── openapi.yaml         # OpenAPI specification
├── package.json
└── tsconfig.json
```

## Directory Details

### `/src/config`
Contains all configuration files for the application.

**Files:**
- `env.ts` - Environment variable configuration and validation
- `keycloak.ts` - Keycloak authentication configuration
- `openapi.ts` - OpenAPI/Swagger configuration
- `rateLimit.ts` - Rate limiting configuration

### `/src/db`
Database connection and setup.

**Files:**
- `mongoose.ts` - MongoDB connection using Mongoose

### `/src/models`
Mongoose schemas and models representing database collections.

**Files:**
- `Batch.ts` - Batch/cohort model
- `Course.ts` - Course model
- `CourseAssignment.ts` - Course assignment model
- `CourseSection.ts` - Course section model
- `File.ts` - File metadata model
- `StudentBatch.ts` - Student-batch relationship model
- `StudentProgress.ts` - Student progress tracking model
- `Test.ts` - Test/quiz model
- `TestAnswer.ts` - Test answer model
- `TestQuestion.ts` - Test question model
- `TestSubmission.ts` - Test submission model
- `User.ts` - User model

### `/src/repositories`
Data Access Layer - handles all database operations.

**Files:**
- `adminRepository.ts` - Admin dashboard data queries
- `assignmentsRepository.ts` - Course assignment operations
- `batchesRepository.ts` - Batch CRUD operations
- `coursesRepository.ts` - Course CRUD operations
- `filesRepository.ts` - File metadata operations
- `progressRepository.ts` - Student progress operations
- `sectionsRepository.ts` - Course section operations
- `studentBatchesRepository.ts` - Student-batch relationship operations
- `testQuestionsRepository.ts` - Test question operations
- `testSubmissionsRepository.ts` - Test submission operations
- `testsRepository.ts` - Test CRUD operations
- `usersRepository.ts` - User CRUD operations

### `/src/services`
Business Logic Layer - contains all business rules and logic.

**Files:**
- `adminService.ts` - Admin dashboard business logic
- `batchesService.ts` - Batch management logic
- `coursesService.ts` - Course management logic
- `filesService.ts` - File processing logic
- `progressService.ts` - Progress tracking logic
- `studentsService.ts` - Student management logic
- `testsService.ts` - Test/quiz management logic
- `email/` - Email service utilities

### `/src/controllers`
Request handlers - processes HTTP requests and responses.

**Files:**
- `adminController.ts` - Admin endpoints
- `batchesController.ts` - Batch endpoints
- `coursesController.ts` - Course endpoints
- `filesController.ts` - File upload/download endpoints
- `progressController.ts` - Progress tracking endpoints
- `studentsController.ts` - Student endpoints
- `testsController.ts` - Test/quiz endpoints

### `/src/routes`
API route definitions - maps URLs to controllers.

**Files:**
- `index.ts` - Main router that combines all routes
- `admin.ts` - Admin routes
- `batches.ts` - Batch routes
- `courses.ts` - Course routes
- `files.ts` - File routes
- `progress.ts` - Progress routes
- `students.ts` - Student routes
- `tests.ts` - Test routes

### `/src/middlewares`
Express middleware functions.

**Files:**
- `auth.ts` - Authentication and authorization middleware
- `errorHandler.ts` - Global error handling middleware

### `/src/utils`
Utility functions and helpers.

**Files:**
- `validateRequest.ts` - Request validation utilities

### `/src/types`
TypeScript type definitions and interfaces.

## Architecture Flow

The application follows a clear request flow:

```
Request → Route → Middleware → Controller → Service → Repository → Database
                                    ↓
Response ← Controller ← Service ← Repository ← Database
```

### Layer Responsibilities

1. **Routes**: Define API endpoints and map them to controllers
2. **Middlewares**: Handle cross-cutting concerns (auth, validation, error handling)
3. **Controllers**: Parse requests, call services, format responses
4. **Services**: Implement business logic, orchestrate operations
5. **Repositories**: Execute database queries, abstract data access
6. **Models**: Define data structure and validation rules

## Import Conventions

- Controllers import from `../services/`
- Services import from `../repositories/`
- Repositories import from `../models/`
- Routes import from `../controllers/` and `../middlewares/`
- All layers can import from `../config/` and `../utils/`

## Benefits of This Structure

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: Easy to unit test each layer independently
3. **Maintainability**: Changes in one layer don't affect others
4. **Scalability**: Easy to add new features following the same pattern
5. **Readability**: Clear organization makes it easy to find code
6. **Reusability**: Services and repositories can be reused across different controllers

## File Naming Conventions

- Use camelCase for file names: `userService.ts`, `batchesController.ts`
- Use PascalCase for model files: `User.ts`, `Course.ts`
- Use descriptive names that indicate the layer: `*Controller.ts`, `*Service.ts`, `*Repository.ts`
