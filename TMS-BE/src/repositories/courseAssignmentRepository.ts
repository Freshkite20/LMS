import { v4 as uuidv4 } from 'uuid';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { StudentBatch } from '../models/StudentBatch.js';

export class AssignmentsRepository {
  static async assignToStudent(courseId: string, studentId: string, dueDate: string | null) {
    await CourseAssignment.updateOne(
      { course_id: courseId, student_id: studentId },
      {
        $setOnInsert: {
          id: uuidv4(),
          course_id: courseId,
          student_id: studentId,
          due_date: dueDate,
          assigned_at: new Date()
        }
      },
      { upsert: true }
    );
  }
  static async assignToBatch(courseId: string, batchId: string, dueDate: string | null): Promise<number> {
    const studentBatches = await StudentBatch.find({ batch_id: batchId }).lean();
    const studentIds = studentBatches.map((sb: any) => sb.student_id);

    if (studentIds.length === 0) return 0;

    const ops = studentIds.map((sid: string) => ({
      updateOne: {
        filter: { course_id: courseId, student_id: sid },
        update: {
          $setOnInsert: {
            id: uuidv4(),
            course_id: courseId,
            student_id: sid,
            due_date: dueDate,
            assigned_at: new Date()
          }
        },
        upsert: true
      }
    }));

    if (ops.length > 0) {
      await CourseAssignment.bulkWrite(ops);
      return studentIds.length;
    }
    return 0;
  }
}
