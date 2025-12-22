# Training Management System - Python Backend Implementation

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Setup](#project-setup)
3. [Database Configuration](#database-configuration)
4. [API Implementation](#api-implementation)
5. [Keycloak Integration](#keycloak-integration)
6. [File Processing](#file-processing)
7. [Email Service](#email-service)

---

## Technology Stack

### Option 1: FastAPI (Recommended)
- **Framework**: FastAPI
- **Database ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: python-keycloak
- **Async Support**: asyncio, aiofiles
- **File Processing**: pandas, openpyxl, PyPDF2
- **Email**: python-dotenv, sendgrid

### Option 2: Flask
- **Framework**: Flask
- **Database ORM**: SQLAlchemy
- **Migrations**: Flask-Migrate
- **Authentication**: python-keycloak
- **File Processing**: pandas, openpyxl, PyPDF2

---

## Project Setup

### Directory Structure

```
tms-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── batch.py
│   │   ├── test.py
│   │   └── progress.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── batch.py
│   │   └── test.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── students.py
│   │   │   ├── courses.py
│   │   │   ├── batches.py
│   │   │   ├── tests.py
│   │   │   └── progress.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── keycloak_service.py
│   │   ├── email_service.py
│   │   ├── file_processor.py
│   │   ├── excel_parser.py
│   │   └── s3_service.py
│   └── utils/
│       ├── __init__.py
│       ├── security.py
│       └── logger.py
├── alembic/
│   └── versions/
├── tests/
├── requirements.txt
├── .env
└── alembic.ini
```

### requirements.txt

```txt
# FastAPI Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1

# Keycloak Integration
python-keycloak==3.7.0
python-jose[cryptography]==3.3.0

# Validation
pydantic==2.5.0
pydantic-settings==2.1.0
email-validator==2.1.0

# File Processing
pandas==2.1.3
openpyxl==3.1.2
PyPDF2==3.0.1
python-docx==1.1.0
python-magic==0.4.27

# AWS/S3
boto3==1.29.7

# Email
sendgrid==6.11.0

# Utilities
python-dotenv==1.0.0
requests==2.31.0
aiofiles==23.2.1

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

### Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## Database Configuration

### app/config.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Training Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    
    # Keycloak
    KEYCLOAK_SERVER_URL: str
    KEYCLOAK_REALM: str
    KEYCLOAK_CLIENT_ID: str
    KEYCLOAK_CLIENT_SECRET: str
    KEYCLOAK_ADMIN_USERNAME: str
    KEYCLOAK_ADMIN_PASSWORD: str
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET: str
    AWS_REGION: str = "us-east-1"
    
    # Email
    SENDGRID_API_KEY: str
    EMAIL_FROM: str
    
    # Application URLs
    FRONTEND_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### app/database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Models

### app/models/user.py

```python
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keycloak_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### app/models/course.py

```python
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.database import Base

class TemplateType(str, enum.Enum):
    VIDEO_ONLY = "video-only"
    TEXT_VIDEO = "text-video"
    TEXT_IMAGE = "text-image"
    TEXT_ONLY = "text-only"

class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    template_type = Column(Enum(TemplateType), nullable=False)
    difficulty = Column(String(50))
    estimated_duration = Column(Integer)  # in hours
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    sections = relationship("CourseSection", back_populates="course")

class CourseSection(Base):
    __tablename__ = "course_sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    video_url = Column(String(500))
    image_url = Column(String(500))
    order_index = Column(Integer, nullable=False)
    duration = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    course = relationship("Course", back_populates="sections")
```

---

## Schemas (Pydantic)

### app/schemas/user.py

```python
from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional
from datetime import datetime

class StudentEnrollmentRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    batchId: Optional[UUID4] = None

class StudentEnrollmentResponse(BaseModel):
    userId: UUID4
    keycloakId: str
    studentId: str
    email: EmailStr
    temporaryPassword: str
    passwordExpiry: datetime
    batchInfo: Optional[dict] = None

class UserResponse(BaseModel):
    id: UUID4
    email: EmailStr
    firstName: str
    lastName: str
    phone: Optional[str]
    role: str
    
    class Config:
        from_attributes = True
```

### app/schemas/course.py

```python
from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    templateType: str
    difficulty: str
    estimatedDuration: int

class CourseSectionCreate(BaseModel):
    title: str
    content: Optional[str] = None
    videoUrl: Optional[str] = None
    imageUrl: Optional[str] = None
    orderIndex: int
    duration: Optional[int] = None

class CourseResponse(BaseModel):
    id: UUID4
    courseCode: str
    title: str
    description: Optional[str]
    category: str
    templateType: str
    difficulty: str
    estimatedDuration: int
    status: str
    createdAt: datetime
    
    class Config:
        from_attributes = True
```

---

## API Endpoints

### app/api/deps.py

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.config import settings
from app.services.keycloak_service import KeycloakService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Validate Keycloak token and return user info"""
    token = credentials.credentials
    
    try:
        # Verify token with Keycloak
        keycloak_service = KeycloakService()
        user_info = keycloak_service.verify_token(token)
        
        return user_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def require_admin(current_user: dict = Depends(get_current_user)):
    """Require admin role"""
    roles = current_user.get("realm_access", {}).get("roles", [])
    
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user
```

### app/api/v1/students.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.schemas.user import StudentEnrollmentRequest, StudentEnrollmentResponse
from app.services.keycloak_service import KeycloakService
from app.services.email_service import EmailService
from app.models.user import User, UserRole
from app.models.batch import Batch, StudentBatch

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/enroll", response_model=dict)
async def enroll_student(
    request: StudentEnrollmentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Enroll a new student (Admin only)"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    try:
        # Generate temporary password
        from app.utils.security import generate_temporary_password
        temp_password = generate_temporary_password()
        
        # Create user in Keycloak
        keycloak_service = KeycloakService()
        keycloak_user_id = await keycloak_service.create_user(
            email=request.email,
            first_name=request.firstName,
            last_name=request.lastName,
            password=temp_password,
            role="student"
        )
        
        # Generate student ID
        student_count = db.query(User).filter(User.role == UserRole.STUDENT).count()
        student_id = f"STU{str(student_count + 1).zfill(3)}"
        
        # Create user in database
        db_user = User(
            keycloak_id=keycloak_user_id,
            email=request.email,
            first_name=request.firstName,
            last_name=request.lastName,
            role=UserRole.STUDENT,
            phone=request.phone
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Assign to batch if provided
        batch_info = None
        if request.batchId:
            batch = db.query(Batch).filter(Batch.id == request.batchId).first()
            if batch:
                student_batch = StudentBatch(
                    student_id=db_user.id,
                    batch_id=batch.id
                )
                db.add(student_batch)
                db.commit()
                
                batch_info = {
                    "batchId": str(batch.id),
                    "batchCode": batch.batch_code,
                    "batchName": batch.name
                }
                
                # Update Keycloak attributes
                await keycloak_service.update_user_attributes(
                    keycloak_user_id,
                    {
                        "studentId": [student_id],
                        "batchId": [batch.batch_code]
                    }
                )
        
        # Send welcome email
        email_service = EmailService()
        await email_service.send_welcome_email(
            to=request.email,
            first_name=request.firstName,
            temporary_password=temp_password,
            batch_name=batch_info["batchName"] if batch_info else None
        )
        
        logger.info(f"Student enrolled: {request.email}")
        
        return {
            "success": True,
            "data": {
                "userId": str(db_user.id),
                "keycloakId": keycloak_user_id,
                "studentId": student_id,
                "email": request.email,
                "temporaryPassword": temp_password,
                "passwordExpiry": "2025-11-07T10:00:00Z",
                "batchInfo": batch_info
            },
            "message": "Student enrolled successfully. Welcome email sent."
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error enrolling student: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enroll student: {str(e)}"
        )

@router.get("/{student_id}")
async def get_student_details(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get student details"""
    from uuid import UUID
    
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID format"
        )
    
    user = db.query(User).filter(User.id == student_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Get batches
    from app.models.batch import StudentBatch, Batch
    batches = db.query(Batch).join(StudentBatch).filter(
        StudentBatch.student_id == student_uuid
    ).all()
    
    # Get course statistics
    from app.models.course import CourseAssignment
    from sqlalchemy import func
    
    course_stats = db.query(
        func.count(CourseAssignment.id).label("enrolled_courses")
    ).filter(CourseAssignment.student_id == student_uuid).first()
    
    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone,
            "batches": [
                {
                    "batchId": str(b.id),
                    "batchCode": b.batch_code,
                    "batchName": b.name
                }
                for b in batches
            ],
            "enrolledCourses": course_stats.enrolled_courses or 0,
            "completedCourses": 0,  # TODO: Calculate
            "averageProgress": 0  # TODO: Calculate
        }
    }

@router.get("/{student_id}/courses")
async def get_student_courses(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get student's enrolled courses"""
    from uuid import UUID
    from app.models.course import Course, CourseAssignment, CourseSection
    from app.models.progress import StudentProgress
    from sqlalchemy import func, case
    
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID format"
        )
    
    # Query courses with progress
    courses_query = db.query(
        Course,
        CourseAssignment,
        func.count(CourseSection.id).label("total_sections"),
        func.count(
            case((StudentProgress.completed == True, 1))
        ).label("completed_sections")
    ).join(
        CourseAssignment, Course.id == CourseAssignment.course_id
    ).outerjoin(
        CourseSection, Course.id == CourseSection.course_id
    ).outerjoin(
        StudentProgress,
        (CourseSection.id == StudentProgress.section_id) &
        (StudentProgress.student_id == student_uuid)
    ).filter(
        CourseAssignment.student_id == student_uuid
    ).group_by(
        Course.id, CourseAssignment.id
    ).all()
    
    courses = []
    for course, assignment, total_sections, completed_sections in courses_query:
        progress = 0
        if total_sections > 0:
            progress = int((completed_sections / total_sections) * 100)
        
        status = "not-started"
        if progress == 100:
            status = "completed"
        elif progress > 0:
            status = "in-progress"
        
        courses.append({
            "id": str(course.id),
            "courseCode": course.course_code,
            "title": course.title,
            "description": course.description,
            "templateType": course.template_type.value,
            "progress": progress,
            "sectionsCompleted": completed_sections,
            "totalSections": total_sections,
            "status": status,
            "assignedAt": assignment.assigned_at.isoformat(),
            "dueDate": assignment.due_date.isoformat() if assignment.due_date else None
        })
    
    statistics = {
        "totalEnrolled": len(courses),
        "completed": sum(1 for c in courses if c["status"] == "completed"),
        "inProgress": sum(1 for c in courses if c["status"] == "in-progress"),
        "notStarted": sum(1 for c in courses if c["status"] == "not-started"),
        "averageProgress": int(sum(c["progress"] for c in courses) / len(courses)) if courses else 0
    }
    
    return {
        "success": True,
        "data": {
            "courses": courses,
            "statistics": statistics
        }
    }
```

### app/api/v1/courses.py

```python
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import logging
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.schemas.course import CourseCreate, CourseSectionCreate, CourseResponse
from app.models.course import Course, CourseSection, TemplateType, CourseStatus
from app.services.file_processor import FileProcessor

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_course(
    request: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new course (Admin only)"""
    
    # Generate course code
    course_count = db.query(Course).count()
    course_code = f"C{str(course_count + 1).zfill(3)}"
    
    # Create course
    db_course = Course(
        course_code=course_code,
        title=request.title,
        description=request.description,
        category=request.category,
        template_type=TemplateType(request.templateType),
        difficulty=request.difficulty,
        estimated_duration=request.estimatedDuration,
        created_by=UUID(current_user["sub"])
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    logger.info(f"Course created: {course_code}")
    
    return {
        "success": True,
        "data": {
            "id": str(db_course.id),
            "courseCode": db_course.course_code,
            "title": db_course.title,
            "description": db_course.description,
            "category": db_course.category,
            "templateType": db_course.template_type.value,
            "difficulty": db_course.difficulty,
            "estimatedDuration": db_course.estimated_duration,
            "status": db_course.status.value,
            "createdAt": db_course.created_at.isoformat()
        },
        "message": "Course created successfully"
    }

@router.post("/{course_id}/sections", response_model=dict)
async def add_course_section(
    course_id: str,
    request: CourseSectionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Add a section to a course"""
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid course ID format"
        )
    
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_uuid).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Create section
    db_section = CourseSection(
        course_id=course_uuid,
        title=request.title,
        content=request.content,
        video_url=request.videoUrl,
        image_url=request.imageUrl,
        order_index=request.orderIndex,
        duration=request.duration
    )
    
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    
    return {
        "success": True,
        "data": {
            "id": str(db_section.id),
            "courseId": str(db_section.course_id),
            "title": db_section.title,
            "orderIndex": db_section.order_index,
            "duration": db_section.duration,
            "createdAt": db_section.created_at.isoformat()
        },
        "message": "Section added successfully"
    }

@router.post("/{course_id}/upload-content")
async def upload_course_content(
    course_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Upload course content file for processing"""
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid course ID format"
        )
    
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_uuid).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Save file temporarily
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Process file
        file_processor = FileProcessor(db)
        result = await file_processor.process_content_file(tmp_path, course_uuid)
        
        return {
            "success": True,
            "data": {
                "fileName": file.filename,
                "fileSize": len(content),
                "processingStatus": "completed",
                "extractedSections": result["sections_extracted"]
            },
            "message": "File uploaded and processed successfully"
        }
    finally:
        # Clean up temp file
        os.unlink(tmp_path)

@router.put("/{course_id}/publish")
async def publish_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Publish a course"""
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid course ID format"
        )
    
    course = db.query(Course).filter(Course.id == course_uuid).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Verify course has sections
    section_count = db.query(CourseSection).filter(
        CourseSection.course_id == course_uuid
    ).count()
    
    if section_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish course without sections"
        )
    
    # Update status
    course.status = CourseStatus.PUBLISHED
    db.commit()
    
    logger.info(f"Course published: {course.course_code}")
    
    return {
        "success": True,
        "data": {
            "courseId": str(course.id),
            "status": course.status.value,
            "publishedAt": course.updated_at.isoformat()
        },
        "message": "Course published successfully"
    }

@router.get("/{course_id}")
async def get_course(
    course_id: str,
    include_sections: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get course details"""
    
    try:
        course_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid course ID format"
        )
    
    course = db.query(Course).filter(Course.id == course_uuid).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    response_data = {
        "id": str(course.id),
        "courseCode": course.course_code,
        "title": course.title,
        "description": course.description,
        "templateType": course.template_type.value,
        "status": course.status.value
    }
    
    if include_sections:
        sections = db.query(CourseSection).filter(
            CourseSection.course_id == course_uuid
        ).order_by(CourseSection.order_index).all()
        
        response_data["sections"] = [
            {
                "id": str(s.id),
                "title": s.title,
                "content": s.content,
                "videoUrl": s.video_url,
                "imageUrl": s.image_url,
                "orderIndex": s.order_index,
                "duration": s.duration
            }
            for s in sections
        ]
        response_data["totalSections"] = len(sections)
    
    return {
        "success": True,
        "data": response_data
    }
```

---

## Services

### app/services/keycloak_service.py

```python
from keycloak import KeycloakAdmin, KeycloakOpenID
from keycloak.exceptions import KeycloakError
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class KeycloakService:
    def __init__(self):
        self.admin = KeycloakAdmin(
            server_url=settings.KEYCLOAK_SERVER_URL,
            username=settings.KEYCLOAK_ADMIN_USERNAME,
            password=settings.KEYCLOAK_ADMIN_PASSWORD,
            realm_name="master",
            user_realm_name=settings.KEYCLOAK_REALM,
            client_id="admin-cli",
            verify=True
        )
        
        self.openid = KeycloakOpenID(
            server_url=settings.KEYCLOAK_SERVER_URL,
            client_id=settings.KEYCLOAK_CLIENT_ID,
            realm_name=settings.KEYCLOAK_REALM,
            client_secret_key=settings.KEYCLOAK_CLIENT_SECRET
        )
    
    async def create_user(
        self,
        email: str,
        first_name: str,
        last_name: str,
        password: str,
        role: str
    ) -> str:
        """Create a user in Keycloak"""
        try:
            user_id = self.admin.create_user({
                "username": email,
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "enabled": True,
                "emailVerified": False,
                "credentials": [{
                    "type": "password",
                    "value": password,
                    "temporary": True
                }]
            })
            
            # Assign role
            role_obj = self.admin.get_realm_role(role)
            self.admin.assign_realm_roles(user_id, [role_obj])
            
            logger.info(f"User created in Keycloak: {email}")
            return user_id
            
        except KeycloakError as e:
            logger.error(f"Keycloak error creating user: {str(e)}")
            raise Exception(f"Failed to create user in Keycloak: {str(e)}")
    
    async def update_user_attributes(self, user_id: str, attributes: dict):
        """Update user attributes"""
        try:
            user = self.admin.get_user(user_id)
            user["attributes"] = {**user.get("attributes", {}), **attributes}
            self.admin.update_user(user_id, user)
            
        except KeycloakError as e:
            logger.error(f"Error updating user attributes: {str(e)}")
            raise
    
    def verify_token(self, token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            # Get public key
            public_key = "-----BEGIN PUBLIC KEY-----\n" + \
                        self.openid.public_key() + \
                        "\n-----END PUBLIC KEY-----"
            
            # Decode token
            user_info = self.openid.decode_token(
                token,
                key=public_key,
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_exp": True
                }
            )
            
            return user_info
            
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise Exception("Invalid token")
```

### app/services/email_service.py

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
    
    async def send_welcome_email(
        self,
        to: str,
        first_name: str,
        temporary_password: str,
        batch_name: str = None
    ):
        """Send welcome email to new student"""
        
        batch_text = f"You have been enrolled in the {batch_name} batch." if batch_name else ""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .credentials {{ background: #f0f0f0; padding: 15px; margin: 20px 0; }}
                .button {{ background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to TMS!</h1>
                </div>
                <div class="content">
                    <p>Dear {first_name},</p>
                    <p>Welcome to the Training Management System! {batch_text}</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> {to}</p>
                        <p><strong>Temporary Password:</strong> {temporary_password}</p>
                    </div>
                    
                    <p>You will be required to change your password on first login.</p>
                    
                    <a href="{settings.FRONTEND_URL}/login" class="button">Login Now</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=settings.EMAIL_FROM,
            to_emails=to,
            subject="Welcome to Training Management System",
            html_content=html_content
        )
        
        try:
            response = self.client.send(message)
            logger.info(f"Welcome email sent to {to}")
            return {"success": True}
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            raise
```

---

## Main Application

### app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import students, courses, batches, tests, progress

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    students.router,
    prefix=f"{settings.API_V1_PREFIX}/students",
    tags=["students"]
)
app.include_router(
    courses.router,
    prefix=f"{settings.API_V1_PREFIX}/courses",
    tags=["courses"]
)

@app.get("/")
async def root():
    return {
        "message": "Training Management System API",
        "version": settings.APP_VERSION
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Run Application

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs (Auto-generated Swagger UI)
- **ReDoc**: http://localhost:8000/redoc
