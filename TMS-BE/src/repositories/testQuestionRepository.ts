import { v4 as uuidv4 } from 'uuid';
import XLSX from 'xlsx';
import { TestQuestion } from '../models/TestQuestion.js';

export class TestQuestionsRepository {
  static async parseAndInsert(testId: string, filePath: string) {
    try {
      console.log('Reading Excel file from:', filePath);
      const workbook = XLSX.readFile(filePath);
      console.log('Workbook loaded, sheets:', workbook.SheetNames);

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No sheets found in the Excel file');
      }

      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet);
      console.log('Raw data rows:', rawData.length);

      if (rawData.length === 0) {
        throw new Error('Excel file is empty or has no valid data rows');
      }

      const questions: any[] = rawData.map((row: any, index: number) => {
        const qType = (row['Question Type'] || 'mcq').toLowerCase();
        return {
          id: uuidv4(),
          test_id: testId,
          question_type: qType === 'text' ? 'text' : 'mcq',
          question_text: row['Question Text'] || 'Untitled Question',
          option_a: row['Option A'] || null,
          option_b: row['Option B'] || null,
          option_c: row['Option C'] || null,
          option_d: row['Option D'] || null,
          correct_answer: row['Correct Answer'] || null,
          points: Number(row['Points']) || 1,
          order_index: index + 1
        };
      });

      console.log('Parsed questions:', questions.length);

      if (questions.length > 0) {
        await TestQuestion.insertMany(questions);
        console.log('Questions inserted successfully');
      }

      const mcqCount = questions.filter(q => q.question_type === 'mcq').length;
      const textCount = questions.length - mcqCount;
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

      return {
        totalQuestions: questions.length,
        breakdown: { mcq: mcqCount, text: textCount },
        totalPoints
      };
    } catch (error) {
      console.error('Error in parseAndInsert:', error);
      throw error;
    }
  }
  static async listByTest(testId: string) {
    return TestQuestion.find({ test_id: testId }).sort({ order_index: 1 });
  }
}
