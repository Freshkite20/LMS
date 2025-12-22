import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.js';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { StudentProgress } from '../models/StudentProgress.js';
import { Course } from '../models/Course.js';
import { CourseSection } from '../models/CourseSection.js';

export class UsersRepository {
  static async getByEmail(email: string) {
    return User.findOne({ email });
  }
  static async getById(id: string) {
    return User.findOne({ id });
  }
  static async create(input: {
    keycloak_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'student';
    phone: string | null;
  }) {
    const now = new Date();
    const user = {
      id: uuidv4(),
      keycloak_id: input.keycloak_id,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      role: input.role,
      phone: input.phone,
      created_at: now,
      updated_at: now
    };
    const created = await User.create(user);
    return created;
  }

  static async updateRole(userId: string, role: 'admin' | 'student') {
    const updated = await User.findOneAndUpdate(
      { id: userId },
      { role, updated_at: new Date() },
      { new: true }
    );
    return updated;
  }
  static async getStudentStats(studentId: string) {
    // Reuse the detailed course logic to ensure consistency
    const courses = await this.getStudentCourses(studentId);

    const enrolled = courses.length;
    const completed = courses.filter((c: any) => c.progress === 100).length;

    // Calculate average progress across all enrolled courses
    const totalProgress = courses.reduce((sum: number, c: any) => sum + c.progress, 0);
    const avg = enrolled ? Math.round(totalProgress / enrolled) : 0;

    return { enrolledCourses: enrolled, completedCourses: completed, averageProgress: avg };
  }
  static async getStudentCourses(studentId: string) {
    console.log(`Getting courses for student: ${studentId}`);
    const assignments = await CourseAssignment.find({ student_id: studentId }).lean();
    console.log(`Found ${assignments.length} assignments`);

    if (!assignments.length) return [];

    const courseIds = Array.from(new Set(assignments.map((a: any) => a.course_id)));
    console.log(`Unique course IDs:`, courseIds);

    const courses = await Course.find({ id: { $in: courseIds } }).lean();
    console.log(`Found ${courses.length} courses`);

    const sections = await CourseSection.find({ course_id: { $in: courseIds } }).lean();
    console.log(`Found ${sections.length} total sections for these courses`);

    const progress = await StudentProgress.find({ student_id: studentId, course_id: { $in: courseIds } }).lean();
    console.log(`Found ${progress.length} progress records`);

    return courses.map((course: any) => {
      const courseSections = sections.filter((s: any) => s.course_id === course.id);
      const courseProgress = progress.filter((p: any) => p.course_id === course.id);
      const completedSections = courseProgress.filter((p: any) => p.completed).length;
      const totalSections = courseSections.length || 0;
      // Clamp progress to 100% just in case
      let progressPercent = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;
      if (progressPercent > 100) progressPercent = 100;

      console.log(`Course ${course.title}: Sections=${totalSections}, Completed=${completedSections}, Progress=${progressPercent}%`);

      const courseAssignments = assignments.filter((a: any) => a.course_id === course.id);
      const assignedAt = courseAssignments.reduce(
        (min: Date | null, a: any) => (!min || a.assigned_at < min ? a.assigned_at : min),
        null as Date | null
      );
      const lastAccessed = courseProgress.reduce(
        (max: Date | null, p: any) => (!max || (p.completed_at && p.completed_at > max) ? p.completed_at : max),
        null as Date | null
      );
      const dueDate = courseAssignments[0]?.due_date ?? null;

      return {
        id: course.id,
        courseCode: course.course_code,
        title: course.title,
        description: course.description,
        templateType: course.template_type,
        category: course.category,
        estimatedDuration: course.estimated_duration,
        progress: progressPercent,
        sectionsCompleted: completedSections,
        totalSections,
        status: progressPercent >= 100 ? 'completed' : progressPercent > 0 ? 'in-progress' : 'not-started',
        assignedAt,
        lastAccessed,
        dueDate
      };
    });
  }
}
