import { TestsRepository } from '../repositories/testRepository.js';
import { TestQuestionsRepository } from '../repositories/testQuestionRepository.js';
import { TestSubmissionsRepository } from '../repositories/testSubmissionRepository.js';

export class TestsService {
  static async createTest(input: any) {
    const test = await TestsRepository.create({
      course_id: input.courseId,
      title: input.title,
      description: input.description || null,
      duration: input.duration,
      passing_score: input.passingScore || 70
    });
    return {
      id: test.id,
      courseId: test.course_id,
      title: test.title,
      duration: test.duration,
      passingScore: test.passing_score,
      createdAt: test.created_at
    };
  }

  static async uploadQuestions(testId: string, file: Express.Multer.File) {
    // For demo: add dummy results based on file presence
    const parsed = await TestQuestionsRepository.parseAndInsert(testId, file.path);
    return {
      testId,
      questionsAdded: parsed.totalQuestions,
      breakdown: parsed.breakdown,
      totalPoints: parsed.totalPoints,
      errors: []
    };
  }

  static async getTest(testId: string, includeQuestions: boolean) {
    const test = await TestsRepository.getById(testId);
    if (!test) throw Object.assign(new Error('Test not found'), { status: 404 });
    const result: any = {
      id: test.id,
      courseId: test.course_id,
      title: test.title,
      duration: test.duration,
      passingScore: test.passing_score
    };
    if (includeQuestions) {
      const questions = await TestQuestionsRepository.listByTest(testId);
      result.questions = questions.map((q) => ({
        id: q.id,
        questionType: q.question_type,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        points: q.points,
        orderIndex: q.order_index
      }));
      result.totalQuestions = questions.length;
      result.totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
    }
    return result;
  }

  static async submit(testId: string, input: { studentId: string; answers: { questionId: string; answerText: string }[] }) {
    const auto = await TestSubmissionsRepository.submitAndAutoGrade(testId, input.studentId, input.answers);
    return {
      submissionId: auto.submissionId,
      testId,
      studentId: input.studentId,
      submittedAt: auto.submittedAt,
      autoGradedScore: auto.autoGradedScore,
      maxAutoGradedScore: auto.maxAutoGradedScore,
      status: 'submitted',
      pendingManualGrading: auto.pendingManualGrading,
      message: 'Test submitted. MCQ questions auto-graded. Text answers pending review.',
      correctCount: auto.correctCount,
      totalQuestions: auto.totalQuestions,
      answerDetails: auto.answerDetails
    };
  }

  static async getSubmission(testId: string, submissionId: string) {
    const res = await TestSubmissionsRepository.getSubmission(testId, submissionId);
    return res;
  }

  static async getTestsByCourse(courseId: string) {
    const tests = await TestsRepository.listByCourse(courseId);
    return tests.map(test => ({
      id: test.id,
      courseId: test.course_id,
      title: test.title,
      duration: test.duration,
      passingScore: test.passing_score
    }));
  }
}

