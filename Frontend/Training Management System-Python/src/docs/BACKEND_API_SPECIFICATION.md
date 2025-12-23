# Training Management System - Backend API Specification

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [File Processing Services](#file-processing-services)
6. [Email Services](#email-services)
7. [Error Handling](#error-handling)

---

## Architecture Overview

### Technology Stack
- **Identity Management**: Keycloak
- **Backend Framework**: Node.js/Express or Spring Boot (recommended)
- **Database**: PostgreSQL
- **File Storage**: AWS S3 or Azure Blob Storage
- **Email Service**: SendGrid or AWS SES
- **Cache**: Redis (optional, for session management)

### System Components
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│  Keycloak   │
│   (React)   │     │   API Server │     │   Server    │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ├─────▶ PostgreSQL
                            ├─────▶ File Storage
                            └─────▶ Email Service
```

---

## Authentication & Authorization

### Keycloak Integration

#### 1. Login Endpoint
**Frontend calls Keycloak directly** or via backend proxy

```http
POST /auth/realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

username=admin@tms.com&password=admin123&grant_type=password&client_id=tms-client
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 3600,
  "refresh_expires_in": 36000,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "Bearer",
  "session_state": "d8f5e7c3-4a2b-4e1f-9c3d-2a1b3c4d5e6f",
  "scope": "profile email"
}
```

#### 2. Get User Info
```http
GET /auth/realms/{realm}/protocol/openid-connect/userinfo
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "sub": "f:1234567:admin@tms.com",
  "email_verified": true,
  "name": "Admin User",
  "preferred_username": "admin@tms.com",
  "given_name": "Admin",
  "family_name": "User",
  "email": "admin@tms.com",
  "roles": ["admin"]
}
```

#### 3. Create User in Keycloak (Admin Only)
```http
POST /admin/realms/{realm}/users
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "username": "john.doe@example.com",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "enabled": true,
  "emailVerified": false,
  "credentials": [
    {
      "type": "password",
      "value": "TempPass123@",
      "temporary": true
    }
  ],
  "realmRoles": ["student"],
  "attributes": {
    "studentId": ["STU001"],
    "batchId": ["B001"]
  }
}
```

**Response:**
```http
201 Created
Location: https://keycloak.example.com/admin/realms/tms/users/a1b2c3d4-e5f6-7890
```

#### 4. Reset Password
```http
PUT /admin/realms/{realm}/users/{user-id}/reset-password
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "type": "password",
  "value": "NewTempPass456@",
  "temporary": true
}
```

**Response:**
```http
204 No Content
```

---

## Database Schema

### Tables

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'student')),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. batches
```sql
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. student_batches
```sql
CREATE TABLE student_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, batch_id)
);
```

#### 4. courses
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    template_type VARCHAR(50) NOT NULL CHECK (
        template_type IN ('video-only', 'text-video', 'text-image', 'text-only')
    ),
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- in hours
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. course_sections
```sql
CREATE TABLE course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    video_url VARCHAR(500),
    image_url VARCHAR(500),
    order_index INTEGER NOT NULL,
    duration INTEGER, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. course_assignments
```sql
CREATE TABLE course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    UNIQUE(course_id, student_id)
);
```

#### 7. student_progress
```sql
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    time_spent INTEGER DEFAULT 0, -- in seconds
    UNIQUE(student_id, course_id, section_id)
);
```

#### 8. tests
```sql
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    passing_score INTEGER DEFAULT 70,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. test_questions
```sql
CREATE TABLE test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('mcq', 'text')),
    question_text TEXT NOT NULL,
    option_a VARCHAR(500),
    option_b VARCHAR(500),
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_answer VARCHAR(500), -- For MCQ: 'A', 'B', 'C', 'D'; For text: model answer
    points INTEGER DEFAULT 5,
    order_index INTEGER NOT NULL
);
```

#### 10. test_submissions
```sql
CREATE TABLE test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    max_score INTEGER,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (
        status IN ('in-progress', 'submitted', 'graded')
    ),
    UNIQUE(test_id, student_id)
);
```

#### 11. test_answers
```sql
CREATE TABLE test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES test_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES test_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP
);
```

#### 12. file_uploads
```sql
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed')
    )
);
```

---

## API Endpoints

### Base URL
```
https://api.tms.example.com/v1
```

### Common Headers
```http
Authorization: Bearer {keycloak_access_token}
Content-Type: application/json
```

---

### 1. Student Enrollment

#### Enroll Student
```http
POST /api/v1/students/enroll
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "batchId": "b1a2c3d4-e5f6-7890-a1b2-c3d4e5f67890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
    "keycloakId": "f:1234567:john.doe@example.com",
    "studentId": "STU001",
    "email": "john.doe@example.com",
    "temporaryPassword": "TempPass123@",
    "passwordExpiry": "2025-11-07T10:00:00Z",
    "batchInfo": {
      "batchId": "b1a2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
      "batchCode": "B001",
      "batchName": "Web Development Q1 2025"
    }
  },
  "message": "Student enrolled successfully. Welcome email sent."
}
```

#### Get Student Details
```http
GET /api/v1/students/{studentId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "batches": [
      {
        "batchId": "b1a2c3d4-e5f6-7890",
        "batchCode": "B001",
        "batchName": "Web Development Q1 2025",
        "enrolledAt": "2025-10-31T10:00:00Z"
      }
    ],
    "enrolledCourses": 4,
    "completedCourses": 1,
    "averageProgress": 52
  }
}
```

---

### 2. Batch Management

#### Create Batch
```http
POST /api/v1/batches
```

**Request:**
```json
{
  "name": "Web Development Q2 2025",
  "description": "Advanced web development cohort",
  "startDate": "2025-04-01",
  "endDate": "2025-06-30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "c2d3e4f5-g6h7-8901-b2c3-d4e5f6g78901",
    "batchCode": "B005",
    "name": "Web Development Q2 2025",
    "description": "Advanced web development cohort",
    "startDate": "2025-04-01",
    "endDate": "2025-06-30",
    "status": "draft",
    "createdAt": "2025-10-31T10:30:00Z"
  },
  "message": "Batch created successfully"
}
```

#### Get All Batches
```http
GET /api/v1/batches?status=active&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "b1a2c3d4-e5f6-7890",
        "batchCode": "B001",
        "name": "Web Development Q1 2025",
        "studentCount": 32,
        "courseCount": 5,
        "averageProgress": 68,
        "startDate": "2025-01-15",
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

#### Assign Students to Batch
```http
POST /api/v1/batches/{batchId}/students
```

**Request:**
```json
{
  "studentIds": [
    "a1b2c3d4-e5f6-7890",
    "b2c3d4e5-f6g7-8901"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "b1a2c3d4-e5f6-7890",
    "assignedCount": 2,
    "studentIds": [
      "a1b2c3d4-e5f6-7890",
      "b2c3d4e5-f6g7-8901"
    ]
  },
  "message": "2 students assigned to batch successfully"
}
```

---

### 3. Course Management

#### Create Course
```http
POST /api/v1/courses
```

**Request:**
```json
{
  "title": "React Fundamentals",
  "description": "Learn the basics of React",
  "category": "Web Development",
  "templateType": "text-video",
  "difficulty": "beginner",
  "estimatedDuration": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "d3e4f5g6-h7i8-9012-c3d4-e5f6g7h89012",
    "courseCode": "C001",
    "title": "React Fundamentals",
    "description": "Learn the basics of React",
    "category": "Web Development",
    "templateType": "text-video",
    "difficulty": "beginner",
    "estimatedDuration": 8,
    "status": "draft",
    "createdAt": "2025-10-31T11:00:00Z"
  },
  "message": "Course created successfully"
}
```

#### Add Course Section
```http
POST /api/v1/courses/{courseId}/sections
```

**Request:**
```json
{
  "title": "Introduction to React",
  "content": "React is a popular JavaScript library...",
  "videoUrl": "https://storage.example.com/videos/react-intro.mp4",
  "imageUrl": null,
  "orderIndex": 1,
  "duration": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e4f5g6h7-i8j9-0123-d4e5-f6g7h8i90123",
    "courseId": "d3e4f5g6-h7i8-9012",
    "title": "Introduction to React",
    "orderIndex": 1,
    "duration": 30,
    "createdAt": "2025-10-31T11:15:00Z"
  },
  "message": "Section added successfully"
}
```

#### Upload Course Content (File)
```http
POST /api/v1/courses/{courseId}/upload-content
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
- file: course-content.zip
- extractSections: true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "f5g6h7i8-j9k0-1234-e5f6-g7h8i9j01234",
    "fileName": "course-content.zip",
    "fileSize": 15728640,
    "processingStatus": "processing",
    "jobId": "proc-123456"
  },
  "message": "File uploaded. Processing started."
}
```

#### Check Processing Status
```http
GET /api/v1/files/{fileId}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "f5g6h7i8-j9k0-1234",
    "processingStatus": "completed",
    "extractedSections": 12,
    "errors": [],
    "completedAt": "2025-10-31T11:20:00Z"
  }
}
```

#### Publish Course
```http
PUT /api/v1/courses/{courseId}/publish
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courseId": "d3e4f5g6-h7i8-9012",
    "status": "published",
    "publishedAt": "2025-10-31T11:30:00Z"
  },
  "message": "Course published successfully"
}
```

#### Get Course with Sections
```http
GET /api/v1/courses/{courseId}?includeSections=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "d3e4f5g6-h7i8-9012",
    "courseCode": "C001",
    "title": "React Fundamentals",
    "description": "Learn the basics of React",
    "templateType": "text-video",
    "status": "published",
    "sections": [
      {
        "id": "e4f5g6h7-i8j9-0123",
        "title": "Introduction to React",
        "content": "React is a popular...",
        "videoUrl": "https://storage.example.com/videos/react-intro.mp4",
        "orderIndex": 1,
        "duration": 30
      }
    ],
    "totalSections": 12,
    "totalDuration": 480
  }
}
```

---

### 4. Course Assignment

#### Assign Course to Students
```http
POST /api/v1/courses/{courseId}/assign
```

**Request:**
```json
{
  "assignmentType": "individual",
  "studentIds": [
    "a1b2c3d4-e5f6-7890",
    "b2c3d4e5-f6g7-8901"
  ],
  "dueDate": "2025-11-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courseId": "d3e4f5g6-h7i8-9012",
    "assignedCount": 2,
    "assignments": [
      {
        "id": "g6h7i8j9-k0l1-2345",
        "studentId": "a1b2c3d4-e5f6-7890",
        "assignedAt": "2025-10-31T12:00:00Z",
        "dueDate": "2025-11-15"
      }
    ]
  },
  "message": "Course assigned to 2 students"
}
```

#### Assign Course to Batch
```http
POST /api/v1/courses/{courseId}/assign
```

**Request:**
```json
{
  "assignmentType": "batch",
  "batchIds": [
    "b1a2c3d4-e5f6-7890"
  ],
  "dueDate": "2025-11-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courseId": "d3e4f5g6-h7i8-9012",
    "batchCount": 1,
    "totalStudentsAffected": 32,
    "assignments": [
      {
        "batchId": "b1a2c3d4-e5f6-7890",
        "batchName": "Web Development Q1 2025",
        "studentsAssigned": 32
      }
    ]
  },
  "message": "Course assigned to 1 batch (32 students)"
}
```

---

### 5. Student Progress Tracking

#### Get Student Enrolled Courses
```http
GET /api/v1/students/{studentId}/courses
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "d3e4f5g6-h7i8-9012",
        "courseCode": "C001",
        "title": "React Fundamentals",
        "description": "Learn the basics of React",
        "templateType": "text-video",
        "progress": 72,
        "sectionsCompleted": 8,
        "totalSections": 12,
        "status": "in-progress",
        "assignedAt": "2025-10-15T10:00:00Z",
        "lastAccessed": "2025-10-28T14:30:00Z",
        "dueDate": "2025-11-15"
      }
    ],
    "statistics": {
      "totalEnrolled": 4,
      "completed": 1,
      "inProgress": 3,
      "notStarted": 0,
      "averageProgress": 52
    }
  }
}
```

#### Update Section Progress
```http
POST /api/v1/progress/sections/{sectionId}/complete
```

**Request:**
```json
{
  "studentId": "a1b2c3d4-e5f6-7890",
  "courseId": "d3e4f5g6-h7i8-9012",
  "timeSpent": 1800
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progressId": "h7i8j9k0-l1m2-3456",
    "sectionId": "e4f5g6h7-i8j9-0123",
    "completed": true,
    "completedAt": "2025-10-31T13:00:00Z",
    "courseProgress": {
      "completedSections": 9,
      "totalSections": 12,
      "progressPercentage": 75
    }
  },
  "message": "Section marked as complete"
}
```

#### Get Batch Progress
```http
GET /api/v1/batches/{batchId}/progress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "b1a2c3d4-e5f6-7890",
    "batchName": "Web Development Q1 2025",
    "totalStudents": 32,
    "courses": [
      {
        "courseId": "d3e4f5g6-h7i8-9012",
        "courseTitle": "React Fundamentals",
        "studentsEnrolled": 32,
        "averageProgress": 68,
        "studentsCompleted": 15,
        "studentsInProgress": 14,
        "studentsNotStarted": 3
      }
    ],
    "overallProgress": 68
  }
}
```

---

### 6. Test Management

#### Upload Test Questions (Excel)
```http
POST /api/v1/tests/{testId}/upload-questions
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
- file: test-questions.xlsx
- courseId: d3e4f5g6-h7i8-9012
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": "i8j9k0l1-m2n3-4567",
    "questionsAdded": 15,
    "breakdown": {
      "mcq": 10,
      "text": 5
    },
    "totalPoints": 75,
    "errors": []
  },
  "message": "15 questions uploaded successfully"
}
```

#### Create Test
```http
POST /api/v1/tests
```

**Request:**
```json
{
  "courseId": "d3e4f5g6-h7i8-9012",
  "title": "React Fundamentals - Final Test",
  "description": "Test your React knowledge",
  "duration": 45,
  "passingScore": 70
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "i8j9k0l1-m2n3-4567",
    "courseId": "d3e4f5g6-h7i8-9012",
    "title": "React Fundamentals - Final Test",
    "duration": 45,
    "passingScore": 70,
    "createdAt": "2025-10-31T14:00:00Z"
  },
  "message": "Test created successfully"
}
```

#### Get Test with Questions
```http
GET /api/v1/tests/{testId}?includeQuestions=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "i8j9k0l1-m2n3-4567",
    "courseId": "d3e4f5g6-h7i8-9012",
    "title": "React Fundamentals - Final Test",
    "duration": 45,
    "passingScore": 70,
    "questions": [
      {
        "id": "j9k0l1m2-n3o4-5678",
        "questionType": "mcq",
        "questionText": "What is JSX?",
        "optionA": "A JavaScript XML syntax extension",
        "optionB": "A CSS preprocessor",
        "optionC": "A testing framework",
        "optionD": "A database query language",
        "points": 5,
        "orderIndex": 1
      },
      {
        "id": "k0l1m2n3-o4p5-6789",
        "questionType": "text",
        "questionText": "Explain the difference between props and state",
        "points": 10,
        "orderIndex": 2
      }
    ],
    "totalQuestions": 15,
    "totalPoints": 75
  }
}
```

#### Submit Test
```http
POST /api/v1/tests/{testId}/submit
```

**Request:**
```json
{
  "studentId": "a1b2c3d4-e5f6-7890",
  "answers": [
    {
      "questionId": "j9k0l1m2-n3o4-5678",
      "answerText": "A"
    },
    {
      "questionId": "k0l1m2n3-o4p5-6789",
      "answerText": "Props are read-only data passed from parent to child..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "l1m2n3o4-p5q6-7890",
    "testId": "i8j9k0l1-m2n3-4567",
    "studentId": "a1b2c3d4-e5f6-7890",
    "submittedAt": "2025-10-31T15:00:00Z",
    "autoGradedScore": 45,
    "maxAutoGradedScore": 50,
    "status": "submitted",
    "pendingManualGrading": 5,
    "message": "Test submitted. MCQ questions auto-graded. Text answers pending review."
  }
}
```

#### Get Test Results
```http
GET /api/v1/tests/{testId}/submissions/{submissionId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "l1m2n3o4-p5q6-7890",
    "testId": "i8j9k0l1-m2n3-4567",
    "studentId": "a1b2c3d4-e5f6-7890",
    "submittedAt": "2025-10-31T15:00:00Z",
    "score": 65,
    "maxScore": 75,
    "percentage": 87,
    "status": "graded",
    "passed": true,
    "answers": [
      {
        "questionId": "j9k0l1m2-n3o4-5678",
        "questionText": "What is JSX?",
        "answerText": "A",
        "isCorrect": true,
        "pointsEarned": 5,
        "maxPoints": 5
      }
    ]
  }
}
```

---

### 7. Dashboard & Analytics

#### Admin Dashboard Stats
```http
GET /api/v1/admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalBatches": 8,
      "totalStudents": 156,
      "totalCourses": 24,
      "activeCourses": 18
    },
    "recentActivity": [
      {
        "type": "student_enrolled",
        "studentName": "John Doe",
        "batchName": "Web Development Q1 2025",
        "timestamp": "2025-10-31T10:00:00Z"
      },
      {
        "type": "course_published",
        "courseTitle": "React Fundamentals",
        "publishedBy": "Admin User",
        "timestamp": "2025-10-31T11:30:00Z"
      }
    ],
    "topPerformingBatches": [
      {
        "batchId": "b1a2c3d4-e5f6-7890",
        "batchName": "Web Development Q1 2025",
        "averageProgress": 82
      }
    ]
  }
}
```

---

## File Processing Services

### Content Extraction Service

#### Service Architecture
```
Upload → Storage → Queue → Processor → Database
```

#### Content Processor Worker

**Input:** File uploaded to storage
**Process:**
1. Extract content from ZIP/PDF/DOCX
2. Parse structure (headings, sections, media)
3. Extract embedded media
4. Generate course sections
5. Store in database

**Example Processing Job:**
```json
{
  "jobId": "proc-123456",
  "fileId": "f5g6h7i8-j9k0-1234",
  "fileType": "application/zip",
  "status": "processing",
  "progress": 45,
  "steps": [
    {
      "step": "extraction",
      "status": "completed",
      "message": "12 files extracted"
    },
    {
      "step": "parsing",
      "status": "in-progress",
      "message": "Processing document 6 of 12"
    },
    {
      "step": "media-upload",
      "status": "pending"
    },
    {
      "step": "database-insert",
      "status": "pending"
    }
  ]
}
```

### Excel Test Parser

**Input:** Excel file with columns:
- Question
- Question Type (MCQ/Text)
- Option A
- Option B
- Option C
- Option D
- Correct Answer
- Points

**Output:**
```json
{
  "questions": [
    {
      "questionType": "mcq",
      "questionText": "What is JSX?",
      "optionA": "A JavaScript XML syntax extension",
      "optionB": "A CSS preprocessor",
      "optionC": "A testing framework",
      "optionD": "A database query language",
      "correctAnswer": "A",
      "points": 5
    }
  ],
  "summary": {
    "totalQuestions": 15,
    "mcqCount": 10,
    "textCount": 5,
    "totalPoints": 75
  }
}
```

---

## Email Services

### Email Templates

#### 1. Student Welcome Email
```json
{
  "template": "student-welcome",
  "to": "john.doe@example.com",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "temporaryPassword": "TempPass123@",
    "loginUrl": "https://tms.example.com/login",
    "batchName": "Web Development Q1 2025"
  }
}
```

**Email Content:**
```
Subject: Welcome to Training Management System

Dear John Doe,

Welcome to the Training Management System! You have been enrolled in the Web Development Q1 2025 batch.

Your login credentials:
Email: john.doe@example.com
Temporary Password: TempPass123@

Login URL: https://tms.example.com/login

You will be required to change your password on first login.

Best regards,
TMS Team
```

#### 2. Course Assignment Email
```json
{
  "template": "course-assigned",
  "to": "john.doe@example.com",
  "data": {
    "firstName": "John",
    "courseTitle": "React Fundamentals",
    "dueDate": "2025-11-15",
    "courseUrl": "https://tms.example.com/courses/d3e4f5g6-h7i8-9012"
  }
}
```

#### 3. Test Reminder Email
```json
{
  "template": "test-reminder",
  "to": "john.doe@example.com",
  "data": {
    "firstName": "John",
    "testTitle": "React Fundamentals - Final Test",
    "dueDate": "2025-11-05",
    "testUrl": "https://tms.example.com/tests/i8j9k0l1-m2n3-4567"
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-10-31T16:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `KEYCLOAK_ERROR` | 500 | Keycloak integration error |
| `PROCESSING_ERROR` | 500 | File processing failed |
| `RDATABASE_ERRO` | 500 | Database operation failed |

---

## Security Considerations

### 1. Token Validation
All endpoints must validate the Keycloak JWT token:
```javascript
// Pseudo-code
async function validateToken(request) {
  const token = request.headers.authorization?.split(' ')[1];
  const publicKey = await getKeycloakPublicKey();
  const decoded = jwt.verify(token, publicKey);
  return decoded;
}
```

### 2. Role-Based Access Control
```javascript
const permissions = {
  'admin': ['*'],
  'student': [
    'GET /api/v1/students/:id',
    'GET /api/v1/courses/:id',
    'POST /api/v1/progress/*',
    'POST /api/v1/tests/:id/submit'
  ]
};
```

### 3. Data Validation
- Validate all input data
- Sanitize file uploads
- Check file types and sizes
- Prevent SQL injection
- XSS protection

---

## Rate Limiting

```json
{
  "windowMs": 900000,
  "max": 100,
  "message": "Too many requests from this IP"
}
```

---

## Monitoring & Logging

### Log Events
- Authentication attempts
- API requests/responses
- File processing jobs
- Email sending status
- Error occurrences

### Metrics to Track
- API response times
- Database query performance
- File processing duration
- Student engagement rates
- Course completion rates
