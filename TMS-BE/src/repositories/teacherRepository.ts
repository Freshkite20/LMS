import { Batch } from '../models/Batch.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';

export class TeachersRepository {
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
}
