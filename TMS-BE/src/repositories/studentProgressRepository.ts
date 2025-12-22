import { StudentProgress } from '../models/StudentProgress.js';
import { CourseSection } from '../models/CourseSection.js';

export class ProgressRepository {
  static async completeSection(input: {
    student_id: string;
    course_id: string;
    section_id: string;
    time_spent: number;
  }) {
    const now = new Date();
    const result = await StudentProgress.findOneAndUpdate(
      {
        student_id: input.student_id,
        course_id: input.course_id,
        section_id: input.section_id
      },
      {
        $set: {
          student_id: input.student_id,
          course_id: input.course_id,
          section_id: input.section_id,
          completed: true,
          completed_at: now
        },
        $inc: {
          time_spent: input.time_spent
        }
      },
      { upsert: true, new: true }
    );
    return result;
  }

  static async getCourseProgress(studentId: string, courseId: string) {
    const totalSections = await CourseSection.countDocuments({ course_id: courseId });

    const completedSections = await StudentProgress.countDocuments({
      student_id: studentId,
      course_id: courseId,
      completed: true
    });

    const progressPercentage = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;

    return {
      completedSections,
      totalSections,
      progressPercentage
    };
  }

  static async getStudentProgressForCourse(studentId: string, courseId: string) {
    const progressRecords = await StudentProgress.find({
      student_id: studentId,
      course_id: courseId
    }).lean();

    return progressRecords.map((record: any) => ({
      sectionId: record.section_id,
      completed: record.completed,
      completedAt: record.completed_at,
      timeSpent: record.time_spent
    }));
  }
}
