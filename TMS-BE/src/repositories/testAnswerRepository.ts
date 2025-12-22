import { TestAnswer, ITestAnswer } from '../models/TestAnswer.js';
import { v4 as uuidv4 } from 'uuid';

// Type for lean query results (plain objects without Mongoose Document methods)
type TestAnswerDoc = Omit<ITestAnswer, keyof Document>;

export class TestAnswersRepository {
    /**
     * Create a new test answer
     */
    static async create(data: {
        submission_id: string;
        question_id: string;
        answer_text?: string;
        is_correct?: boolean | null;
        points_earned?: number;
    }): Promise<any> {
        const answer = await TestAnswer.create({
            id: uuidv4(),
            submission_id: data.submission_id,
            question_id: data.question_id,
            answer_text: data.answer_text || null,
            is_correct: data.is_correct ?? null,
            points_earned: data.points_earned || 0
        });
        return answer;
    }

    /**
     * Get all answers for a submission
     */
    static async getBySubmissionId(submissionId: string): Promise<any[]> {
        return await TestAnswer.find({ submission_id: submissionId }).lean();
    }

    /**
     * Get a specific answer by ID
     */
    static async getById(answerId: string): Promise<any> {
        return await TestAnswer.findOne({ id: answerId }).lean();
    }

    /**
     * Update answer grading (for manual grading of text answers)
     */
    static async updateGrading(
        answerId: string,
        isCorrect: boolean,
        pointsEarned: number
    ): Promise<any> {
        const updated = await TestAnswer.findOneAndUpdate(
            { id: answerId },
            {
                $set: {
                    is_correct: isCorrect,
                    points_earned: pointsEarned
                }
            },
            { new: true }
        ).lean();
        return updated;
    }

    /**
     * Get answers by question ID
     */
    static async getByQuestionId(questionId: string): Promise<any[]> {
        return await TestAnswer.find({ question_id: questionId }).lean();
    }

    /**
     * Delete all answers for a submission
     */
    static async deleteBySubmissionId(submissionId: string): Promise<number> {
        const result = await TestAnswer.deleteMany({ submission_id: submissionId });
        return result.deletedCount || 0;
    }

    /**
     * Get answer statistics for a question
     */
    static async getQuestionStats(questionId: string) {
        const answers = await TestAnswer.find({ question_id: questionId }).lean();
        const totalAnswers = answers.length;
        const correctAnswers = answers.filter((a: any) => a.is_correct === true).length;
        const incorrectAnswers = answers.filter((a: any) => a.is_correct === false).length;
        const pendingGrading = answers.filter((a: any) => a.is_correct === null).length;

        return {
            totalAnswers,
            correctAnswers,
            incorrectAnswers,
            pendingGrading,
            correctPercentage: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0
        };
    }
}
