# TMS Backend - Complete Folder Structure

## 📁 Root Directory
```
TMS-BE/
├── 📄 .env                          # Environment configuration
├── 📄 .gitignore                    # Git ignore rules
├── 📄 API_REFERENCE.md              # API documentation
├── 📄 FOLDER_STRUCTURE.md           # Folder structure guide
├── 📄 OPENAPI.md                    # OpenAPI specification guide
├── 📄 OPENAPI_IMPLEMENTATION.md     # OpenAPI implementation details
├── 📄 PROJECT_UPDATE_SUMMARY.md     # Recent updates summary
├── 📄 README.md                     # Main project documentation
├── 📄 openapi.yaml                  # OpenAPI specification
├── 📄 package.json                  # NPM dependencies and scripts
├── 📄 package-lock.json             # NPM lock file
├── 📄 tsconfig.json                 # TypeScript configuration
│
├── 📂 dist/                         # Compiled JavaScript output
│   ├── 📂 config/                   # Compiled config files
│   ├── 📂 controllers/              # Compiled controllers
│   ├── 📂 db/                       # Compiled database connection
│   ├── 📂 middlewares/              # Compiled middlewares
│   ├── 📂 models/                   # Compiled Mongoose models
│   ├── 📂 repositories/             # Compiled repositories
│   ├── 📂 routes/                   # Compiled routes
│   ├── 📂 services/                 # Compiled services
│   │   └── 📂 email/                # Email service
│   ├── 📂 types/                    # Compiled type definitions
│   ├── 📂 utils/                    # Compiled utilities
│   ├── 📄 app.js                    # Compiled Express app
│   └── 📄 index.js                  # Compiled entry point
│
├── 📂 node_modules/                 # NPM dependencies (gitignored)
│
├── 📂 scripts/                      # Utility scripts
│   ├── 📄 README.md                 # Scripts documentation
│   ├── 📄 clean-build.mjs           # Clean build script
│   ├── 📄 seed-db.mjs               # Database seeding script
│   └── 📄 validate-env.mjs          # Environment validation script
│
├── 📂 src/                          # Source code (TypeScript)
│   ├── 📂 config/                   # Configuration files
│   │   ├── 📄 env.ts                # Environment config
│   │   ├── 📄 keycloak.ts           # Keycloak config
│   │   ├── 📄 openapi.ts            # OpenAPI config
│   │   └── 📄 rateLimit.ts          # Rate limiting config
│   │
│   ├── 📂 controllers/              # HTTP request handlers
│   │   ├── 📄 adminController.ts
│   │   ├── 📄 batchesController.ts
│   │   ├── 📄 coursesController.ts
│   │   ├── 📄 filesController.ts
│   │   ├── 📄 progressController.ts
│   │   ├── 📄 studentsController.ts
│   │   └── 📄 testsController.ts
│   │
│   ├── 📂 db/                       # Database connection
│   │   └── 📄 mongoose.ts           # Mongoose setup
│   │
│   ├── 📂 middlewares/              # Express middlewares
│   │   ├── 📄 auth.ts               # Authentication middleware
│   │   └── 📄 errorHandler.ts       # Error handling middleware
│   │
│   ├── 📂 models/                   # Mongoose schemas
│   │   ├── 📄 Batch.ts
│   │   ├── 📄 Course.ts
│   │   ├── 📄 CourseAssignment.ts
│   │   ├── 📄 CourseSection.ts
│   │   ├── 📄 File.ts
│   │   ├── 📄 StudentBatch.ts
│   │   ├── 📄 StudentProgress.ts
│   │   ├── 📄 Test.ts
│   │   ├── 📄 TestAnswer.ts
│   │   ├── 📄 TestQuestion.ts
│   │   ├── 📄 TestSubmission.ts
│   │   └── 📄 User.ts
│   │
│   ├── 📂 repositories/             # Data access layer
│   │   ├── 📄 adminRepository.ts
│   │   ├── 📄 assignmentsRepository.ts
│   │   ├── 📄 batchesRepository.ts
│   │   ├── 📄 coursesRepository.ts
│   │   ├── 📄 filesRepository.ts
│   │   ├── 📄 progressRepository.ts
│   │   ├── 📄 sectionsRepository.ts
│   │   ├── 📄 studentBatchesRepository.ts
│   │   ├── 📄 testQuestionsRepository.ts
│   │   ├── 📄 testSubmissionsRepository.ts
│   │   ├── 📄 testsRepository.ts
│   │   └── 📄 usersRepository.ts
│   │
│   ├── 📂 routes/                   # API route definitions
│   │   ├── 📄 admin.ts
│   │   ├── 📄 batches.ts
│   │   ├── 📄 courses.ts
│   │   ├── 📄 files.ts
│   │   ├── 📄 index.ts              # Main router
│   │   ├── 📄 progress.ts
│   │   ├── 📄 students.ts
│   │   └── 📄 tests.ts
│   │
│   ├── 📂 services/                 # Business logic layer
│   │   ├── 📂 email/                # Email services
│   │   │   └── 📄 emailService.ts
│   │   ├── 📄 adminService.ts
│   │   ├── 📄 batchesService.ts
│   │   ├── 📄 coursesService.ts
│   │   ├── 📄 filesService.ts
│   │   ├── 📄 progressService.ts
│   │   ├── 📄 studentsService.ts
│   │   └── 📄 testsService.ts
│   │
│   ├── 📂 types/                    # TypeScript type definitions
│   │   └── 📄 index.ts              # Common types and interfaces
│   │
│   ├── 📂 utils/                    # Utility functions
│   │   └── 📄 validateRequest.ts    # Request validation
│   │
│   ├── 📄 app.ts                    # Express app configuration
│   └── 📄 index.ts                  # Application entry point
│
└── 📂 uploads/                      # File upload storage
    ├── 📄 .gitkeep                  # Preserve directory in git
    └── 📄 README.md                 # Upload directory documentation
```

## 📊 Statistics

### Source Code (src/)
- **Total Files**: 58
- **Configuration Files**: 4
- **Controllers**: 7
- **Models**: 12
- **Repositories**: 12
- **Services**: 8 (including email service)
- **Routes**: 8
- **Middlewares**: 2
- **Utilities**: 1
- **Type Definitions**: 1

### Scripts
- **Utility Scripts**: 3
- **Documentation**: 1 README

### Documentation Files
- **Main README**: Comprehensive project guide
- **API Documentation**: 3 files (API_REFERENCE, OPENAPI, OPENAPI_IMPLEMENTATION)
- **Folder Structure**: Detailed structure documentation
- **Update Summary**: Recent changes documentation
- **Scripts README**: Scripts usage guide
- **Uploads README**: Upload directory guide

### Build Output (dist/)
- **Mirrors src/ structure exactly**
- **All TypeScript compiled to JavaScript**
- **Proper module resolution**

## ✅ Folder Status

| Folder | Status | Files | Purpose |
|--------|--------|-------|---------|
| `src/config/` | ✅ Complete | 4 | Application configuration |
| `src/controllers/` | ✅ Complete | 7 | HTTP request handlers |
| `src/db/` | ✅ Complete | 1 | Database connection |
| `src/middlewares/` | ✅ Complete | 2 | Express middlewares |
| `src/models/` | ✅ Complete | 12 | Mongoose schemas |
| `src/repositories/` | ✅ Complete | 12 | Data access layer |
| `src/routes/` | ✅ Complete | 8 | API route definitions |
| `src/services/` | ✅ Complete | 8 | Business logic |
| `src/types/` | ✅ Complete | 1 | TypeScript types |
| `src/utils/` | ✅ Complete | 1 | Utility functions |
| `scripts/` | ✅ Complete | 4 | Development scripts |
| `uploads/` | ✅ Complete | 2 | File storage |
| `dist/` | ✅ Complete | Auto | Compiled output |

## 🎯 Key Improvements

1. **✅ All folders have proper files**
   - No empty folders without purpose
   - All folders documented

2. **✅ Consistent structure**
   - src/ and dist/ mirror each other
   - Clear separation of concerns

3. **✅ Comprehensive documentation**
   - README in every major folder
   - Clear usage instructions

4. **✅ Developer-friendly**
   - Utility scripts for common tasks
   - Type definitions for better DX
   - Environment validation

5. **✅ Production-ready**
   - Proper .gitignore
   - Clean build process
   - Security best practices

---

**Last Updated**: December 5, 2024  
**Status**: ✅ All folders properly organized and documented
