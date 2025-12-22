import { CoursesRepository } from '../repositories/courseRepository.js';
import { SectionsRepository } from '../repositories/courseSectionRepository.js';
import { AssignmentsRepository } from '../repositories/courseAssignmentRepository.js';
import { FilesRepository } from '../repositories/fileRepository.js';

export class CoursesService {
  static async createCourse(input: any) {
    const course = await CoursesRepository.create({
      title: input.title,
      description: input.description || null,
      category: input.category || null,
      template_type: input.templateType,
      difficulty: input.difficulty || null,
      estimated_duration: input.estimatedDuration || null
    });
    return {
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
    };
  }

  static async addSection(courseId: string, input: any) {
    const section = await SectionsRepository.create(courseId, {
      title: input.title,
      content: input.content || null,
      video_url: input.videoUrl || null,
      image_url: input.imageUrl || null,
      order_index: input.orderIndex,
      duration: input.duration || null
    });
    return {
      id: section.id,
      courseId: section.course_id,
      title: section.title,
      orderIndex: section.order_index,
      duration: section.duration,
      createdAt: section.created_at
    };
  }

  static async uploadContent(courseId: string, file: Express.Multer.File, userId: string) {
    const record = await FilesRepository.create({
      file_name: file.originalname,
      file_path: file.path,
      file_type: file.mimetype,
      file_size: file.size,
      uploaded_by: userId
    });
    // Simulate async processing job
    await FilesRepository.updateStatus(record.id, 'processing');
    return {
      fileId: record.id,
      fileName: record.file_name,
      fileSize: record.file_size,
      processingStatus: 'processing',
      jobId: `proc-${record.id.slice(0, 8)}`
    };
  }

  static async getCourse(courseId: string, includeSections: boolean) {
    const course = await CoursesRepository.getById(courseId);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });
    const result: any = {
      id: course.id,
      courseCode: course.course_code,
      title: course.title,
      description: course.description,
      templateType: course.template_type,
      status: course.status
    };
    if (includeSections) {
      const sections = await SectionsRepository.listByCourse(courseId);
      result.sections = sections.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        videoUrl: s.video_url,
        orderIndex: s.order_index,
        duration: s.duration
      }));
      result.totalSections = sections.length;
      result.totalDuration = sections.reduce((acc, s) => acc + (s.duration || 0), 0);
    }
    return result;
  }

  static async publishCourse(courseId: string) {
    const course = await CoursesRepository.publish(courseId);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });
    return { courseId: course.id, status: course.status, publishedAt: course.updated_at };
  }

  static async assignCourse(courseId: string, input: any) {
    if (input.assignmentType === 'individual') {
      for (const sid of input.studentIds || []) {
        await AssignmentsRepository.assignToStudent(courseId, sid, input.dueDate || null);
      }
      return {
        courseId,
        assignedCount: (input.studentIds || []).length,
        assignments: (input.studentIds || []).map((sid: string) => ({ id: 'na', studentId: sid, assignedAt: new Date().toISOString(), dueDate: input.dueDate || null })),
        message: `Course assigned to ${(input.studentIds || []).length} students`
      };
    }
    if (input.assignmentType === 'batch') {
      let totalCount = 0;
      const assignments = [];
      const batchIds = input.batchIds || [];

      for (const batchId of batchIds) {
        const count = await AssignmentsRepository.assignToBatch(courseId, batchId, input.dueDate || null);
        totalCount += count;
        assignments.push({
          batchId,
          batchName: 'N/A', // Could fetch name if needed, but keeping it simple for now
          studentsAssigned: count
        });
      }

      return {
        courseId,
        batchCount: batchIds.length,
        totalStudentsAffected: totalCount,
        assignments,
        message: `Course assigned to ${batchIds.length} batch(es) (${totalCount} students)`
      };
    }
    throw Object.assign(new Error('Invalid assignmentType'), { status: 400 });
  }

  static async listCourses(status?: string) {
    const courses = await CoursesRepository.getAll(status);
    return courses.map(course => ({
      id: course.id,
      courseCode: course.course_code,
      title: course.title,
      description: course.description,
      category: course.category,
      templateType: course.template_type,
      difficulty: course.difficulty,
      estimatedDuration: course.estimated_duration,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));
  }
}

