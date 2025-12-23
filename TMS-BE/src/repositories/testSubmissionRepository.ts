import { v4 as uuidv4 } from 'uuid';
import { TestSubmission } from '../models/TestSubmission.js';
import { TestQuestion } from '../models/TestQuestion.js';
import { TestAnswer } from '../models/TestAnswer.js';

export class TestSubmissionsRepository {
  static async submitAndAutoGrade(
    testId: string,
    studentId: string,
    answers: { questionId: string; answerText: string }[]
  ) {
    const now = new Date();
    const submission = {
      id: uuidv4(),
      test_id: testId,
      student_id: studentId,
      status: 'submitted',
      submitted_at: now,
      score: 0,
      max_score: 0
    };
    await TestSubmission.create(submission);

    // Fetch questions for grading
    const questions = await TestQuestion.find({ test_id: testId }).lean();
    let autoGradedScore = 0;
    let maxAuto = 0;
    let pendingManual = 0;
    let correctCount = 0;
    const answerDetails: any[] = [];

    for (const a of answers) {
      const q = questions.find((qq: any) => qq.id === a.questionId);
      if (!q) continue;
      let isCorrect: boolean | null = null;
      let pointsEarned = 0;
      if (q.question_type === 'mcq') {
        maxAuto += q.points || 0;
        isCorrect = (a.answerText || '').trim().toUpperCase() === (q.correct_answer || '').trim().toUpperCase();
        pointsEarned = isCorrect ? q.points || 0 : 0;
        autoGradedScore += pointsEarned;
        if (isCorrect) correctCount++;
      } else {
        pendingManual += q.points || 0;
      }

      // Add to details
      answerDetails.push({
        questionId: q.id,
        isCorrect,
        correctAnswer: q.correct_answer,
        userAnswer: a.answerText
      });

      await TestAnswer.create({
        id: uuidv4(),
        submission_id: submission.id,
        question_id: a.questionId,
        answer_text: a.answerText,
        is_correct: isCorrect,
        points_earned: pointsEarned
      });
    }
    const maxScore = maxAuto + pendingManual;
    await TestSubmission.updateOne({ id: submission.id }, { $set: { score: autoGradedScore, max_score: maxScore } });

    return {
      submissionId: submission.id,
      submittedAt: submission.submitted_at,
      autoGradedScore: autoGradedScore,
      maxAutoGradedScore: maxAuto,
      pendingManualGrading: pendingManual,
      correctCount,
      totalQuestions: questions.length,
      answerDetails
    };
  }

  static async getSubmission(testId: string, submissionId: string) {
    const sub = await TestSubmission.findOne({ id: submissionId, test_id: testId }).lean();
    if (!sub) return null;
    const answers = await TestAnswer.find({ submission_id: submissionId }).lean();
    const questions = await TestQuestion.find({ id: { $in: answers.map((a: any) => a.question_id) } }).lean();
    const qMap = new Map<string, any>();
    for (const q of questions) {
      qMap.set(q.id, q);
    }
    const score = Number(sub.score || 0);
    const maxScore = Number(sub.max_score || 0);
    return {
      submissionId: sub.id,
      testId: sub.test_id,
      studentId: sub.student_id,
      submittedAt: sub.submitted_at,
      score,
      maxScore,
      percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
      status: sub.status,
      passed: false,
      answers: answers.map((r: any) => {
        const q = qMap.get(r.question_id);
        return {
          questionId: r.question_id,
          questionText: q?.question_text,
          answerText: r.answer_text,
          isCorrect: r.is_correct,
          pointsEarned: Number(r.points_earned || 0),
          maxPoints: Number(q?.points || 0)
        };
      })
    };
  }
}
