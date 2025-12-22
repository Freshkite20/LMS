import { v4 as uuidv4 } from 'uuid';
import { Course } from '../models/Course.js';

export class CoursesRepository {
  static async create(input: any) {
    const code = `C${String(Math.floor(Math.random() * 900) + 100)}`;
    const now = new Date();
    const course = {
      id: uuidv4(),
      course_code: code,
      title: input.title,
      description: input.description,
      category: input.category,
      template_type: input.template_type,
      difficulty: input.difficulty,
      estimated_duration: input.estimated_duration,
      status: 'draft',
      created_at: now,
      updated_at: now
    };
    await Course.create(course);
    return course;
  }
  static async getById(id: string) {
    return Course.findOne({ id });
  }
  static async publish(id: string) {
    const now = new Date();
    const result = await Course.findOneAndUpdate(
      { id },
      { $set: { status: 'published', updated_at: now } },
      { new: true }
    );
    return result;
  }

  static async getAll(status?: string) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    return Course.find(filter).sort({ created_at: -1 });
  }
}
