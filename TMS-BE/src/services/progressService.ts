import { ProgressRepository } from '../repositories/studentProgressRepository.js';

export class ProgressService {
  static async completeSection(sectionId: string, input: { studentId: string; courseId: string; timeSpent: number }) {
    const record = await ProgressRepository.completeSection({
      student_id: input.studentId,
      course_id: input.courseId,
      section_id: sectionId,
      time_spent: input.timeSpent
    });
    return {
      progressId: record.id,
      sectionId: record.section_id,
      completed: record.completed,
      completedAt: record.completed_at,
      courseProgress: await ProgressRepository.getCourseProgress(input.studentId, input.courseId)
    };
  }

  static async getStudentProgress(studentId: string, courseId: string) {
    return await ProgressRepository.getStudentProgressForCourse(studentId, courseId);
  }
}

