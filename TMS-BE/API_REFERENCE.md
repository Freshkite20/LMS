# TMS API Quick Reference

Base URL: `http://localhost:3000/api/v1`
Documentation: `http://localhost:3000/api-docs`

## Authentication
All endpoints (except `/health` and `/auth/*`) require JWT Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Overview

### 🏥 Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | None |

### 🔐 Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/signup` | Register user | None |
| POST | `/api/v1/auth/login` | Login user | None |
| POST | `/api/v1/auth/refresh` | Refresh token | None |

### 👨‍💼 Admin
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/dashboard` | Get dashboard stats | Admin |

### 📚 Batches
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/v1/batches` | Create batch | Admin |
| GET | `/api/v1/batches` | List batches | Admin |
| POST | `/api/v1/batches/{batchId}/students` | Assign students | Admin |
| GET | `/api/v1/batches/{batchId}/progress` | View batch progress | Admin |

### 📖 Courses
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/v1/courses` | Create course | Admin |
| GET | `/api/v1/courses/{courseId}` | Get course | Admin, Student |
| POST | `/api/v1/courses/{courseId}/sections` | Add section | Admin |
| POST | `/api/v1/courses/{courseId}/upload-content` | Upload content | Admin |
| PUT | `/api/v1/courses/{courseId}/publish` | Publish course | Admin |
| POST | `/api/v1/courses/{courseId}/assign` | Assign course | Admin |

### 👨‍🎓 Students
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/v1/students/enroll` | Enroll student | Admin |
| GET | `/api/v1/students/{studentId}` | Get student | Admin, Student |
| GET | `/api/v1/students/{studentId}/courses` | Get student courses | Admin, Student |

### 📝 Tests
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/v1/tests` | Create test | Admin |
| GET | `/api/v1/tests/{testId}` | Get test | Admin, Student |
| POST | `/api/v1/tests/{testId}/upload-questions` | Upload questions | Admin |
| POST | `/api/v1/tests/{testId}/submit` | Submit test | Admin, Student |
| GET | `/api/v1/tests/{testId}/submissions/{submissionId}` | Get submission | Admin, Student |

### 📊 Progress
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/v1/progress/sections/{sectionId}/complete` | Mark section complete | Admin, Student |

### 📁 Files
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/v1/files/{fileId}/status` | Get file status | Admin |

## Common Request Examples

### Create Batch
```bash
POST /api/v1/batches
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Web Development Batch Q1 2024",
  "description": "Full-stack web development training",
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-04-15T00:00:00Z"
}
```

### Create Course
```bash
POST /api/v1/courses
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Introduction to JavaScript",
  "description": "Learn JavaScript fundamentals",
  "category": "Programming",
  "templateType": "text-video",
  "difficulty": "beginner",
  "estimatedDuration": 2400
}
```

### Signup User
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

### Enroll Student
```bash
POST /api/v1/students/enroll
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "batchId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Submit Test
```bash
POST /api/v1/tests/{testId}/submit
Content-Type: application/json
Authorization: Bearer <token>

{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "answers": [
    {
      "questionId": "650e8400-e29b-41d4-a716-446655440000",
      "answer": "Option A"
    }
  ]
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2024-12-04T14:30:00Z"
}
```

## Error Codes
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Query Parameters

### Pagination
```
GET /api/v1/batches?page=1&limit=10
```

### Filtering
```
GET /api/v1/batches?status=active
```

### Include Relations
```
GET /api/v1/courses/{courseId}?includeSections=true
GET /api/v1/tests/{testId}?includeQuestions=true
```

## Data Types

### UUID Format
```
550e8400-e29b-41d4-a716-446655440000
```

### Date-Time Format (ISO 8601)
```
2024-12-04T14:30:00Z
```

### Email Format
```
user@example.com
```

## Enums

### Batch Status
- `active`
- `archived`

### Course Status
- `draft`
- `published`
- `archived`

### Course Template Type
- `video-only`
- `text-video`
- `text-image`
- `text-only`

### Course Difficulty
- `beginner`
- `intermediate`
- `advanced`

### User Role
- `admin`
- `student`

### File Processing Status
- `pending`
- `processing`
- `completed`
- `failed`

### Assignment Type
- `individual`
- `batch`

## Tips

1. **Use Swagger UI** at `/api-docs` for interactive testing
2. **Include Bearer token** in Authorization header for protected endpoints
3. **Check role requirements** - some endpoints are admin-only
4. **Use UUIDs** for all ID parameters
5. **Follow ISO 8601** for date-time values
6. **Validate enums** - use only allowed values
7. **Handle pagination** for list endpoints
8. **Check error responses** for validation details

## Testing with cURL

```bash
# Get all batches
curl -X GET http://localhost:3000/api/v1/batches \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a course
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "templateType": "text-video"
  }'

# Upload file
curl -X POST http://localhost:3000/api/v1/courses/{courseId}/upload-content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

## Need More Details?

- **Full Documentation**: http://localhost:3000/api-docs
- **OpenAPI Spec**: `openapi.yaml` in project root
- **Usage Guide**: See `OPENAPI.md`
- **Implementation Details**: See `OPENAPI_IMPLEMENTATION.md`
