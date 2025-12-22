# Example Backend Implementations

## Table of Contents
1. [Student Enrollment API](#student-enrollment-api)
2. [Course Management API](#course-management-api)
3. [Progress Tracking API](#progress-tracking-api)
4. [Test Management API](#test-management-api)
5. [File Processing Service](#file-processing-service)
6. [Email Service](#email-service)

---

## Student Enrollment API

### Complete Implementation

**routes/students.js:**
```javascript
const express = require('express');
const router = express.Router();
const { protectWithRole } = require('../middleware/keycloak');
const studentController = require('../controllers/studentController');

// Admin only - Enroll new student
router.post('/enroll', protectWithRole('admin'), studentController.enrollStudent);

// Get student details
router.get('/:id', studentController.getStudentDetails);

// Get student courses
router.get('/:id/courses', studentController.getStudentCourses);

module.exports = router;
```

**controllers/studentController.js:**
```javascript
const db = require('../database');
const keycloakAdmin = require('../services/keycloakAdmin');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

exports.enrollStudent = async (req, res) => {
  const { firstName, lastName, email, phone, batchId } = req.body;
  
  // Validation
  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: []
      }
    });
  }
  
  try {
    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'User with this email already exists'
        }
      });
    }
    
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Create user in Keycloak
    const keycloakUserId = await keycloakAdmin.createUser({
      email,
      firstName,
      lastName,
      temporaryPassword,
      role: 'student'
    });
    
    // Generate student ID
    const studentIdResult = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(keycloak_id FROM 4) AS INTEGER)), 0) + 1 as next_id 
       FROM users WHERE role = 'student'`
    );
    const studentNumber = String(studentIdResult.rows[0].next_id).padStart(3, '0');
    const studentId = `STU${studentNumber}`;
    
    // Insert into database
    const userResult = await db.query(
      `INSERT INTO users (keycloak_id, email, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name`,
      [keycloakUserId, email, firstName, lastName, 'student', phone]
    );
    
    const user = userResult.rows[0];
    
    // Assign to batch if provided
    let batchInfo = null;
    if (batchId) {
      const batchResult = await db.query(
        `SELECT id, batch_code, name FROM batches WHERE id = $1`,
        [batchId]
      );
      
      if (batchResult.rows.length > 0) {
        await db.query(
          `INSERT INTO student_batches (student_id, batch_id) VALUES ($1, $2)`,
          [user.id, batchId]
        );
        
        batchInfo = batchResult.rows[0];
        
        // Update Keycloak attributes
        await keycloakAdmin.updateUserAttributes(keycloakUserId, {
          studentId: [studentId],
          batchId: [batchInfo.batch_code]
        });
      }
    }
    
    // Send welcome email
    await emailService.sendWelcomeEmail({
      to: email,
      firstName,
      temporaryPassword,
      batchName: batchInfo?.name
    });
    
    // Log activity
    logger.info('Student enrolled', {
      studentId: user.id,
      email,
      batchId
    });
    
    res.status(201).json({
      success: true,
      data: {
        userId: user.id,
        keycloakId: keycloakUserId,
        studentId,
        email,
        temporaryPassword,
        passwordExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        batchInfo: batchInfo ? {
          batchId: batchInfo.id,
          batchCode: batchInfo.batch_code,
          batchName: batchInfo.name
        } : null
      },
      message: 'Student enrolled successfully. Welcome email sent.'
    });
    
  } catch (error) {
    logger.error('Error enrolling student', { error: error.message, email });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ENROLLMENT_ERROR',
        message: 'Failed to enroll student',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

exports.getStudentDetails = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get user details
    const userResult = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
              COUNT(DISTINCT ca.course_id) as enrolled_courses,
              COUNT(DISTINCT CASE WHEN cp_summary.progress = 100 THEN ca.course_id END) as completed_courses,
              COALESCE(AVG(cp_summary.progress), 0) as average_progress
       FROM users u
       LEFT JOIN course_assignments ca ON u.id = ca.student_id
       LEFT JOIN (
         SELECT student_id, course_id,
                (COUNT(CASE WHEN completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as progress
         FROM student_progress
         GROUP BY student_id, course_id
       ) cp_summary ON u.id = cp_summary.student_id AND ca.course_id = cp_summary.course_id
       WHERE u.id = $1
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone`,
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found'
        }
      });
    }
    
    const user = userResult.rows[0];
    
    // Get batches
    const batchResult = await db.query(
      `SELECT b.id as batch_id, b.batch_code, b.name as batch_name, sb.enrolled_at
       FROM student_batches sb
       JOIN batches b ON sb.batch_id = b.id
       WHERE sb.student_id = $1
       ORDER BY sb.enrolled_at DESC`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        batches: batchResult.rows.map(b => ({
          batchId: b.batch_id,
          batchCode: b.batch_code,
          batchName: b.batch_name,
          enrolledAt: b.enrolled_at
        })),
        enrolledCourses: parseInt(user.enrolled_courses),
        completedCourses: parseInt(user.completed_courses),
        averageProgress: Math.round(parseFloat(user.average_progress))
      }
    });
    
  } catch (error) {
    logger.error('Error fetching student details', { error: error.message, studentId: id });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch student details'
      }
    });
  }
};

exports.getStudentCourses = async (req, res) => {
  const { id } = req.params;
  
  try {
    const coursesResult = await db.query(
      `SELECT c.id, c.course_code, c.title, c.description, c.template_type,
              ca.assigned_at, ca.due_date,
              COALESCE(progress_data.progress, 0) as progress,
              COALESCE(progress_data.completed_sections, 0) as sections_completed,
              COALESCE(section_count.total, 0) as total_sections,
              CASE
                WHEN progress_data.progress = 100 THEN 'completed'
                WHEN progress_data.progress > 0 THEN 'in-progress'
                ELSE 'not-started'
              END as status,
              progress_data.last_accessed
       FROM course_assignments ca
       JOIN courses c ON ca.course_id = c.id
       LEFT JOIN (
         SELECT course_id, COUNT(*) as total
         FROM course_sections
         GROUP BY course_id
       ) section_count ON c.id = section_count.course_id
       LEFT JOIN (
         SELECT course_id,
                (COUNT(CASE WHEN completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as progress,
                COUNT(CASE WHEN completed THEN 1 END) as completed_sections,
                MAX(completed_at) as last_accessed
         FROM student_progress
         WHERE student_id = $1
         GROUP BY course_id
       ) progress_data ON c.id = progress_data.course_id
       WHERE ca.student_id = $1 AND c.status = 'published'
       ORDER BY ca.assigned_at DESC`,
      [id]
    );
    
    const courses = coursesResult.rows.map(row => ({
      id: row.id,
      courseCode: row.course_code,
      title: row.title,
      description: row.description,
      templateType: row.template_type,
      progress: Math.round(parseFloat(row.progress)),
      sectionsCompleted: parseInt(row.sections_completed),
      totalSections: parseInt(row.total_sections),
      status: row.status,
      assignedAt: row.assigned_at,
      lastAccessed: row.last_accessed,
      dueDate: row.due_date
    }));
    
    const statistics = {
      totalEnrolled: courses.length,
      completed: courses.filter(c => c.status === 'completed').length,
      inProgress: courses.filter(c => c.status === 'in-progress').length,
      notStarted: courses.filter(c => c.status === 'not-started').length,
      averageProgress: courses.length > 0
        ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
        : 0
    };
    
    res.json({
      success: true,
      data: {
        courses,
        statistics
      }
    });
    
  } catch (error) {
    logger.error('Error fetching student courses', { error: error.message, studentId: id });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch student courses'
      }
    });
  }
};

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
  let password = '';
  
  // Ensure at least one of each required character type
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Digit
  password += chars.charAt(62 + Math.floor(Math.random() * 3)); // Special
  
  // Fill remaining characters
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

---

## Course Management API

**controllers/courseController.js:**
```javascript
const db = require('../database');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

exports.createCourse = async (req, res) => {
  const {
    title,
    description,
    category,
    templateType,
    difficulty,
    estimatedDuration
  } = req.body;
  
  const createdBy = req.user.sub; // From Keycloak token
  
  try {
    // Generate course code
    const codeResult = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(course_code FROM 2) AS INTEGER)), 0) + 1 as next_id 
       FROM courses`
    );
    const courseNumber = String(codeResult.rows[0].next_id).padStart(3, '0');
    const courseCode = `C${courseNumber}`;
    
    // Insert course
    const result = await db.query(
      `INSERT INTO courses (
        course_code, title, description, category, template_type,
        difficulty, estimated_duration, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [courseCode, title, description, category, templateType, difficulty, estimatedDuration, createdBy]
    );
    
    const course = result.rows[0];
    
    logger.info('Course created', {
      courseId: course.id,
      courseCode: course.course_code,
      createdBy
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: course.id,
        courseCode: course.course_code,
        title: course.title,
        description: course.description,
        category: course.category,
        templateType: course.template_type,
        difficulty: course.difficulty,
        estimatedDuration: course.estimated_duration,
        status: course.status,
        createdAt: course.created_at
      },
      message: 'Course created successfully'
    });
    
  } catch (error) {
    logger.error('Error creating course', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create course'
      }
    });
  }
};

exports.addCourseSection = async (req, res) => {
  const { courseId } = req.params;
  const { title, content, videoUrl, imageUrl, orderIndex, duration } = req.body;
  
  try {
    // Verify course exists
    const courseCheck = await db.query(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }
    
    // Insert section
    const result = await db.query(
      `INSERT INTO course_sections (
        course_id, title, content, video_url, image_url, order_index, duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [courseId, title, content, videoUrl, imageUrl, orderIndex, duration]
    );
    
    const section = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        id: section.id,
        courseId: section.course_id,
        title: section.title,
        orderIndex: section.order_index,
        duration: section.duration,
        createdAt: section.created_at
      },
      message: 'Section added successfully'
    });
    
  } catch (error) {
    logger.error('Error adding course section', { error: error.message, courseId });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to add section'
      }
    });
  }
};

exports.publishCourse = async (req, res) => {
  const { courseId } = req.params;
  
  try {
    // Verify course has sections
    const sectionCheck = await db.query(
      'SELECT COUNT(*) as count FROM course_sections WHERE course_id = $1',
      [courseId]
    );
    
    if (parseInt(sectionCheck.rows[0].count) === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot publish course without sections'
        }
      });
    }
    
    // Update course status
    const result = await db.query(
      `UPDATE courses SET status = 'published', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, status, updated_at`,
      [courseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }
    
    const course = result.rows[0];
    
    logger.info('Course published', { courseId });
    
    res.json({
      success: true,
      data: {
        courseId: course.id,
        status: course.status,
        publishedAt: course.updated_at
      },
      message: 'Course published successfully'
    });
    
  } catch (error) {
    logger.error('Error publishing course', { error: error.message, courseId });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to publish course'
      }
    });
  }
};
```

---

## Progress Tracking API

**controllers/progressController.js:**
```javascript
const db = require('../database');
const logger = require('../utils/logger');

exports.completeSect = async (req, res) => {
  const { sectionId } = req.params;
  const { studentId, courseId, timeSpent } = req.body;
  
  try {
    // Insert or update progress
    const result = await db.query(
      `INSERT INTO student_progress (student_id, course_id, section_id, completed, completed_at, time_spent)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (student_id, course_id, section_id)
       DO UPDATE SET
         completed = true,
         completed_at = CURRENT_TIMESTAMP,
         time_spent = student_progress.time_spent + $4
       RETURNING id`,
      [studentId, courseId, sectionId, timeSpent || 0]
    );
    
    const progressId = result.rows[0].id;
    
    // Get updated course progress
    const progressResult = await db.query(
      `SELECT
         COUNT(*) as total_sections,
         COUNT(CASE WHEN sp.completed THEN 1 END) as completed_sections
       FROM course_sections cs
       LEFT JOIN student_progress sp ON cs.id = sp.section_id
         AND sp.student_id = $1
         AND sp.course_id = $2
       WHERE cs.course_id = $2`,
      [studentId, courseId]
    );
    
    const totalSections = parseInt(progressResult.rows[0].total_sections);
    const completedSections = parseInt(progressResult.rows[0].completed_sections);
    const progressPercentage = Math.round((completedSections / totalSections) * 100);
    
    logger.info('Section completed', {
      studentId,
      courseId,
      sectionId,
      progressPercentage
    });
    
    res.json({
      success: true,
      data: {
        progressId,
        sectionId,
        completed: true,
        completedAt: new Date().toISOString(),
        courseProgress: {
          completedSections,
          totalSections,
          progressPercentage
        }
      },
      message: 'Section marked as complete'
    });
    
  } catch (error) {
    logger.error('Error updating progress', {
      error: error.message,
      sectionId,
      studentId
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update progress'
      }
    });
  }
};
```

---

## Test Management API

**controllers/testController.js:**
```javascript
const db = require('../database');
const excelParser = require('../services/excelParser');
const logger = require('../utils/logger');

exports.uploadTestQuestions = async (req, res) => {
  const { testId } = req.params;
  const { courseId } = req.body;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'No file uploaded'
      }
    });
  }
  
  try {
    // Parse Excel file
    const questions = await excelParser.parseTestQuestions(file.path);
    
    // Create test if testId is 'new'
    let actualTestId = testId;
    if (testId === 'new') {
      const testResult = await db.query(
        `INSERT INTO tests (course_id, title, duration, passing_score, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [courseId, 'Course Test', 45, 70, req.user.sub]
      );
      actualTestId = testResult.rows[0].id;
    }
    
    // Insert questions
    let mcqCount = 0;
    let textCount = 0;
    let totalPoints = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      await db.query(
        `INSERT INTO test_questions (
          test_id, question_type, question_text,
          option_a, option_b, option_c, option_d,
          correct_answer, points, order_index
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          actualTestId,
          q.questionType,
          q.questionText,
          q.optionA,
          q.optionB,
          q.optionC,
          q.optionD,
          q.correctAnswer,
          q.points,
          i + 1
        ]
      );
      
      if (q.questionType === 'mcq') mcqCount++;
      else textCount++;
      totalPoints += q.points;
    }
    
    logger.info('Test questions uploaded', {
      testId: actualTestId,
      questionCount: questions.length
    });
    
    res.json({
      success: true,
      data: {
        testId: actualTestId,
        questionsAdded: questions.length,
        breakdown: {
          mcq: mcqCount,
          text: textCount
        },
        totalPoints,
        errors: []
      },
      message: `${questions.length} questions uploaded successfully`
    });
    
  } catch (error) {
    logger.error('Error uploading test questions', {
      error: error.message,
      testId
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process test questions'
      }
    });
  }
};

exports.submitTest = async (req, res) => {
  const { testId } = req.params;
  const { studentId, answers } = req.body;
  
  try {
    // Create submission
    const submissionResult = await db.query(
      `INSERT INTO test_submissions (test_id, student_id, status)
       VALUES ($1, $2, 'submitted')
       RETURNING id`,
      [testId, studentId]
    );
    
    const submissionId = submissionResult.rows[0].id;
    
    // Get all questions
    const questionsResult = await db.query(
      'SELECT * FROM test_questions WHERE test_id = $1 ORDER BY order_index',
      [testId]
    );
    
    const questions = questionsResult.rows;
    let autoGradedScore = 0;
    let maxAutoGradedScore = 0;
    let pendingManualGrading = 0;
    
    // Process answers
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      
      if (!question) continue;
      
      let isCorrect = null;
      let pointsEarned = 0;
      
      if (question.question_type === 'mcq') {
        isCorrect = answer.answerText.toUpperCase() === question.correct_answer.toUpperCase();
        pointsEarned = isCorrect ? question.points : 0;
        autoGradedScore += pointsEarned;
        maxAutoGradedScore += question.points;
      } else {
        pendingManualGrading++;
      }
      
      // Insert answer
      await db.query(
        `INSERT INTO test_answers (
          submission_id, question_id, answer_text, is_correct, points_earned
        ) VALUES ($1, $2, $3, $4, $5)`,
        [submissionId, question.id, answer.answerText, isCorrect, pointsEarned]
      );
    }
    
    // Update submission
    await db.query(
      `UPDATE test_submissions
       SET score = $1, max_score = $2
       WHERE id = $3`,
      [autoGradedScore, maxAutoGradedScore, submissionId]
    );
    
    logger.info('Test submitted', {
      testId,
      studentId,
      submissionId,
      autoGradedScore
    });
    
    res.json({
      success: true,
      data: {
        submissionId,
        testId,
        studentId,
        submittedAt: new Date().toISOString(),
        autoGradedScore,
        maxAutoGradedScore,
        status: 'submitted',
        pendingManualGrading,
        message: pendingManualGrading > 0
          ? 'Test submitted. MCQ questions auto-graded. Text answers pending review.'
          : 'Test submitted and graded.'
      }
    });
    
  } catch (error) {
    logger.error('Error submitting test', {
      error: error.message,
      testId,
      studentId
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to submit test'
      }
    });
  }
};
```

---

## File Processing Service

**services/fileProcessor.js:**
```javascript
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const s3Service = require('./s3Service');
const db = require('../database');
const logger = require('../utils/logger');

class FileProcessor {
  async processContentFile(fileId, filePath, courseId) {
    try {
      // Update status
      await this.updateProcessingStatus(fileId, 'processing', 0);
      
      const ext = path.extname(filePath).toLowerCase();
      let sections = [];
      
      if (ext === '.zip') {
        sections = await this.processZipFile(filePath);
      } else if (ext === '.pdf') {
        sections = await this.processPdfFile(filePath);
      } else if (ext === '.docx' || ext === '.doc') {
        sections = await this.processDocxFile(filePath);
      }
      
      await this.updateProcessingStatus(fileId, 'processing', 50);
      
      // Upload media files and insert sections
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // Upload images/videos to S3 if present
        if (section.imagePath) {
          section.imageUrl = await s3Service.uploadFile(section.imagePath);
        }
        
        if (section.videoPath) {
          section.videoUrl = await s3Service.uploadFile(section.videoPath);
        }
        
        // Insert section into database
        await db.query(
          `INSERT INTO course_sections (
            course_id, title, content, video_url, image_url, order_index
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            courseId,
            section.title,
            section.content,
            section.videoUrl,
            section.imageUrl,
            i + 1
          ]
        );
        
        // Update progress
        const progress = 50 + Math.round(((i + 1) / sections.length) * 50);
        await this.updateProcessingStatus(fileId, 'processing', progress);
      }
      
      // Mark as completed
      await this.updateProcessingStatus(fileId, 'completed', 100);
      
      logger.info('File processing completed', {
        fileId,
        courseId,
        sectionsExtracted: sections.length
      });
      
      return {
        success: true,
        extractedSections: sections.length
      };
      
    } catch (error) {
      logger.error('File processing error', {
        error: error.message,
        fileId
      });
      
      await this.updateProcessingStatus(fileId, 'failed', 0);
      throw error;
    }
  }
  
  async processZipFile(zipPath) {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const sections = [];
    const tempDir = path.join(__dirname, '../temp', Date.now().toString());
    
    // Extract zip
    await fs.mkdir(tempDir, { recursive: true });
    zip.extractAllTo(tempDir, true);
    
    // Find and process documents
    const docFiles = zipEntries
      .filter(entry => !entry.isDirectory)
      .filter(entry => {
        const ext = path.extname(entry.entryName).toLowerCase();
        return ['.txt', '.md', '.docx', '.pdf'].includes(ext);
      })
      .sort((a, b) => a.entryName.localeCompare(b.entryName));
    
    for (const docFile of docFiles) {
      const filePath = path.join(tempDir, docFile.entryName);
      const ext = path.extname(docFile.entryName).toLowerCase();
      
      let content = '';
      
      if (ext === '.txt' || ext === '.md') {
        content = await fs.readFile(filePath, 'utf8');
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        content = result.value;
      } else if (ext === '.pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        content = data.text;
      }
      
      // Extract title from filename or first line
      const title = path.basename(docFile.entryName, ext)
        .replace(/[-_]/g, ' ')
        .replace(/^\d+\s*/, ''); // Remove leading numbers
      
      sections.push({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        content: content.trim()
      });
    }
    
    // Find media files
    const mediaFiles = zipEntries.filter(entry => {
      const ext = path.extname(entry.entryName).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm'].includes(ext);
    });
    
    // Associate media with sections (basic matching by name)
    for (const section of sections) {
      const sectionName = section.title.toLowerCase().replace(/\s+/g, '-');
      
      const associatedImage = mediaFiles.find(m => {
        const name = path.basename(m.entryName, path.extname(m.entryName)).toLowerCase();
        return name.includes(sectionName) && ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(m.entryName).toLowerCase());
      });
      
      const associatedVideo = mediaFiles.find(m => {
        const name = path.basename(m.entryName, path.extname(m.entryName)).toLowerCase();
        return name.includes(sectionName) && ['.mp4', '.webm'].includes(path.extname(m.entryName).toLowerCase());
      });
      
      if (associatedImage) {
        section.imagePath = path.join(tempDir, associatedImage.entryName);
      }
      
      if (associatedVideo) {
        section.videoPath = path.join(tempDir, associatedVideo.entryName);
      }
    }
    
    return sections;
  }
  
  async processPdfFile(pdfPath) {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    // Split content by headings (basic implementation)
    const lines = data.text.split('\n');
    const sections = [];
    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if line looks like a heading (all caps, short, etc.)
      if (trimmed.length > 0 && trimmed.length < 100 && trimmed === trimmed.toUpperCase()) {
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        
        currentSection = {
          title: trimmed,
          content: ''
        };
      } else if (currentSection && trimmed.length > 0) {
        currentSection.content += trimmed + '\n';
      }
    }
    
    if (currentSection && currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  async processDocxFile(docxPath) {
    const result = await mammoth.extractRawText({ path: docxPath });
    
    // Similar to PDF processing
    const lines = result.value.split('\n');
    const sections = [];
    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.length > 0 && trimmed.length < 100 && /^[A-Z]/.test(trimmed)) {
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        
        currentSection = {
          title: trimmed,
          content: ''
        };
      } else if (currentSection && trimmed.length > 0) {
        currentSection.content += trimmed + '\n';
      }
    }
    
    if (currentSection && currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  async updateProcessingStatus(fileId, status, progress) {
    await db.query(
      `UPDATE file_uploads
       SET processing_status = $1
       WHERE id = $2`,
      [status, fileId]
    );
  }
}

module.exports = new FileProcessor();
```

**services/excelParser.js:**
```javascript
const XLSX = require('xlsx');

class ExcelParser {
  async parseTestQuestions(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const questions = [];
    
    for (const row of data) {
      const questionType = (row['Question Type'] || '').toLowerCase();
      
      if (questionType === 'mcq') {
        questions.push({
          questionType: 'mcq',
          questionText: row['Question'],
          optionA: row['Option A'],
          optionB: row['Option B'],
          optionC: row['Option C'],
          optionD: row['Option D'],
          correctAnswer: row['Correct Answer'],
          points: parseInt(row['Points']) || 5
        });
      } else if (questionType === 'text') {
        questions.push({
          questionType: 'text',
          questionText: row['Question'],
          correctAnswer: row['Model Answer'] || '',
          points: parseInt(row['Points']) || 10
        });
      }
    }
    
    return questions;
  }
}

module.exports = new ExcelParser();
```

---

## Email Service

**services/emailService.js:**
```javascript
const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

sgMail.setApiKey(process.env.EMAIL_API_KEY);

class EmailService {
  async sendWelcomeEmail({ to, firstName, temporaryPassword, batchName }) {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject: 'Welcome to Training Management System',
      text: `
Dear ${firstName},

Welcome to the Training Management System!${batchName ? ` You have been enrolled in the ${batchName} batch.` : ''}

Your login credentials:
Email: ${to}
Temporary Password: ${temporaryPassword}

Login URL: ${process.env.APP_URL}/login

You will be required to change your password on first login.

Best regards,
TMS Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .credentials { background: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to TMS!</h1>
    </div>
    <div class="content">
      <p>Dear ${firstName},</p>
      
      <p>Welcome to the Training Management System!${batchName ? ` You have been enrolled in the <strong>${batchName}</strong> batch.` : ''}</p>
      
      <div class="credentials">
        <h3>Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      
      <p>You will be required to change your password on first login.</p>
      
      <a href="${process.env.APP_URL}/login" class="button">Login Now</a>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; 2025 Training Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `
    };
    
    try {
      await sgMail.send(msg);
      logger.info('Welcome email sent', { to });
      return { success: true };
    } catch (error) {
      logger.error('Error sending welcome email', { error: error.message, to });
      throw error;
    }
  }
  
  async sendCourseAssignmentEmail({ to, firstName, courseTitle, dueDate, courseUrl }) {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject: `New Course Assigned: ${courseTitle}`,
      text: `
Dear ${firstName},

A new course has been assigned to you: ${courseTitle}

${dueDate ? `Due Date: ${dueDate}` : ''}

Access the course: ${courseUrl}

Best regards,
TMS Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Course Assigned</h1>
    </div>
    <div class="content">
      <p>Dear ${firstName},</p>
      
      <p>A new course has been assigned to you:</p>
      
      <h2>${courseTitle}</h2>
      
      ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
      
      <a href="${courseUrl}" class="button">Start Course</a>
    </div>
  </div>
</body>
</html>
      `
    };
    
    try {
      await sgMail.send(msg);
      logger.info('Course assignment email sent', { to, courseTitle });
      return { success: true };
    } catch (error) {
      logger.error('Error sending course assignment email', { error: error.message, to });
      throw error;
    }
  }
}

module.exports = new EmailService();
```

This completes the comprehensive backend implementation examples!
