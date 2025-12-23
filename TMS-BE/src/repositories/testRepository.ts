import { v4 as uuidv4 } from 'uuid';
import { Test } from '../models/Test.js';

export class TestsRepository {
  static async create(input: any) {
    const now = new Date();
    const test = {
      id: uuidv4(),
      course_id: input.course_id,
      title: input.title,
      description: input.description,
      duration: input.duration,
      passing_score: input.passing_score,
      created_at: now,
      updated_at: now
    };
    console.log('Creating test:', test);
    const result = await Test.create(test);
    console.log('Test created successfully:', result);
    return test;
  }
  static async getById(testId: string) {
    return Test.findOne({ id: testId });
  }

  static async listByCourse(courseId: string) {
    return Test.find({ course_id: courseId });
  }
}
