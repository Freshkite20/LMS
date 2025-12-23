import { Batch } from '../models/Batch.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { StudentProgress } from '../models/StudentProgress.js';
import { StudentBatch } from '../models/StudentBatch.js';

export class AdminRepository {
  static async getDashboardStats() {
    const [batches, students, courses, activeCourses] = await Promise.all([
      Batch.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' })
    ]);
    return {
      overview: {
        totalBatches: batches,
        totalStudents: students,
        totalCourses: courses,
        activeCourses: activeCourses
      },
      recentActivity: [],
      topPerformingBatches: []
    };
  }

  static async getBatches() {
    const batches = await Batch.find().sort({ created_at: -1 }).lean();

    const batchesWithStats = await Promise.all(
      batches.map(async (batch: any) => {
        const studentCount = await StudentBatch.countDocuments({ batch_id: batch.id });

        // Get courses assigned to this batch
        const assignments = await CourseAssignment.find({ batch_id: batch.id }).lean();
        const courseIds = [...new Set(assignments.map((a: any) => a.course_id))];
        const courseCount = courseIds.length;

        // Calculate average progress for students in this batch
        const batchStudents = await StudentBatch.find({ batch_id: batch.id }).lean();
        const studentIds = batchStudents.map((bs: any) => bs.student_id);

        let avgProgress = 0;
        if (studentIds.length > 0 && courseIds.length > 0) {
          const progressRecords = await StudentProgress.find({
            student_id: { $in: studentIds },
            course_id: { $in: courseIds }
          }).lean();

          if (progressRecords.length > 0) {
            const totalProgress = progressRecords.reduce((sum: number, p: any) =>
              sum + (p.completed ? 100 : 0), 0
            );
            avgProgress = Math.round(totalProgress / progressRecords.length);
          }
        }

        return {
          id: batch.id,
          name: batch.name,
          description: batch.description,
          students: studentCount,
          courses: courseCount,
          progress: avgProgress,
          startDate: batch.start_date,
          endDate: batch.end_date,
          status: batch.status
        };
      })
    );

    return batchesWithStats;
  }

  static async getCourses() {
    const courses = await Course.find().sort({ created_at: -1 }).lean();

    const coursesWithStats = await Promise.all(
      courses.map(async (course: any) => {
        const enrolledCount = await CourseAssignment.countDocuments({ course_id: course.id });

        // Calculate average progress
        const progressRecords = await StudentProgress.find({ course_id: course.id }).lean();
        let avgProgress = 0;

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce((sum: number, p: any) =>
            sum + (p.completed ? 100 : 0), 0
          );
          avgProgress = Math.round(totalProgress / progressRecords.length);
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          template: course.template_type,
          enrolled: enrolledCount,
          avgProgress: avgProgress,
          status: course.status,
          category: course.category,
          difficulty: course.difficulty,
          createdAt: course.created_at
        };
      })
    );

    return coursesWithStats;
  }

  static async getRecentStudents(limit: number = 10) {
    const students = await User.find({ role: 'student' })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    const studentsWithBatch = await Promise.all(
      students.map(async (student: any) => {
        const batchStudent = await StudentBatch.findOne({ student_id: student.id }).lean();
        let batchName = 'No Batch';

        if (batchStudent) {
          const batch = await Batch.findOne({ id: batchStudent.batch_id }).lean();
          batchName = batch?.name || 'Unknown';
        }

        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim(),
          email: student.email,
          batch: batchName,
          enrolled: student.created_at
        };
      })
    );

    return studentsWithBatch;
  }
}

