import { UsersRepository } from '../repositories/userRepository.js';
import { BatchesRepository } from '../repositories/batchRepository.js';
import { StudentBatchesRepository } from '../repositories/studentBatchRepository.js';
import { EmailService } from './email/emailService.js';
import { KeycloakAdminService } from './keycloakAdminService.js';
import { v4 as uuidv4 } from 'uuid';

export class StudentsService {
  static async enrollStudent(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    batchId: string;
  }) {
    const batch = await BatchesRepository.getById(input.batchId);
    if (!batch) throw Object.assign(new Error('Batch not found'), { status: 404 });

    const existing = await UsersRepository.getByEmail(input.email);
    if (existing) throw Object.assign(new Error('User already exists'), { status: 409, code: 'DUPLICATE_ENTRY' });

    const temporaryPassword = 'TempPass123@';

    // Create user in Keycloak first
    let keycloakId: string;
    try {
      keycloakId = await KeycloakAdminService.createUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: temporaryPassword,
        username: input.firstName + input.lastName // Start with email as username
      });
    } catch (error: any) {
      // If user already exists in Keycloak, we might want to fetch their ID
      // For now, if 409, we should check if we can proceed or fail.
      // The requirement says "new student has to be created", so failure on 409 is acceptable 
      // but let's be robust. If it exists in Keycloak but not in DB, we could technically link them.
      // However, simplified flow: fail if Keycloak user exists. 
      throw error;
    }

    const user = await UsersRepository.create({
      keycloak_id: keycloakId,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      role: 'student',
      phone: input.phone || null
    });

    await StudentBatchesRepository.assign(user.id, input.batchId);

    await EmailService.sendStudentWelcome({
      to: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      temporaryPassword,
      batchName: batch.name
    });

    return {
      userId: user.id,
      keycloakId,
      studentId: 'STU001',
      email: user.email,
      temporaryPassword,
      passwordExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      batchInfo: {
        batchId: batch.id,
        batchCode: batch.batch_code,
        batchName: batch.name
      }
    };
  }

  static async getStudentById(studentId: string) {
    const user = await UsersRepository.getById(studentId);
    if (!user) throw Object.assign(new Error('Student not found'), { status: 404 });
    const batches = await BatchesRepository.getByStudentId(studentId);
    const stats = await UsersRepository.getStudentStats(studentId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      batches: batches.map((b) => ({
        batchId: b.id,
        batchCode: b.batch_code,
        batchName: b.name,
        enrolledAt: b.enrolled_at
      })),
      enrolledCourses: stats.enrolledCourses,
      completedCourses: stats.completedCourses,
      averageProgress: stats.averageProgress
    };
  }

  static async getStudentCourses(studentId: string) {
    const courses = await UsersRepository.getStudentCourses(studentId);
    return {
      courses,
      statistics: {
        totalEnrolled: courses.length,
        completed: courses.filter((c) => c.status === 'completed').length,
        inProgress: courses.filter((c) => c.status === 'in-progress').length,
        notStarted: courses.filter((c) => c.status === 'not-started').length,
        averageProgress: Math.round(
          courses.reduce((acc, c) => acc + (c.progress || 0), 0) / (courses.length || 1)
        )
      }
    };
  }
  static async getDashboardStats(email: string) {
    const user = await UsersRepository.getByEmail(email);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return this.getStudentById(user.id);
  }
}

