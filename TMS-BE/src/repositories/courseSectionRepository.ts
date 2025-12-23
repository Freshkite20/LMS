import { v4 as uuidv4 } from 'uuid';
import { CourseSection } from '../models/CourseSection.js';

export class SectionsRepository {
  static async create(courseId: string, input: any) {
    const now = new Date();
    const section = {
      id: uuidv4(),
      course_id: courseId,
      title: input.title,
      content: input.content,
      video_url: input.video_url,
      image_url: input.image_url,
      order_index: input.order_index,
      duration: input.duration,
      created_at: now
    };
    await CourseSection.create(section);
    return section;
  }
  static async listByCourse(courseId: string) {
    return CourseSection.find({ course_id: courseId }).sort({ order_index: 1 });
  }
}
