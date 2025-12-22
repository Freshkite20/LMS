import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { testService } from '../services/testService';

interface TestModuleProps {
  test: any;
  courseId: string;
  studentId: string;
  onBack: () => void;
}

export function TestModule({ test, courseId, studentId, onBack }: TestModuleProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    const fetchTestContent = async () => {
      try {
        setLoading(true);
        console.log('Fetching test content for:', test.id);
        const testData = await testService.getTest(test.id);

        const mappedQuestions = (testData.questions || []).map((q: any) => {
          // Combine separate options into an array
          const options = [];
          if (q.optionA) options.push(q.optionA);
          if (q.optionB) options.push(q.optionB);
          if (q.optionC) options.push(q.optionC);
          if (q.optionD) options.push(q.optionD);

          return {
            id: q.id,
            type: q.questionType,
            question: q.questionText,
            options: options,
            correctAnswer: q.correctAnswer, // Note: backend returns string (e.g., 'A'), frontend might expect index or string. Let's adjust logic later if needed.
            points: q.points
          };
        });

        setQuestions(mappedQuestions);
        if (testData.duration) {
          setTimeRemaining(testData.duration * 60);
        }
      } catch (error) {
        console.error('Error fetching test questions:', error);
        alert('Failed to load test questions.');
      } finally {
        setLoading(false);
      }
    };

    if (test?.id) {
      fetchTestContent();
    }
  }, [test.id]);

  const handleMCQAnswer = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers({ ...answers, [questionId]: text });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitted(true);

      // Format answers for backend
      const formattedAnswers = Object.keys(answers).map(questionId => {
        const answer = answers[questionId];
        const question = questions.find(q => q.id === questionId);

        let answerText = '';
        if (question?.type === 'mcq') {
          // Convert index 0,1,2,3 to A,B,C,D
          const options = ['A', 'B', 'C', 'D'];
          answerText = options[answer as number] || '';
        } else {
          answerText = answer as string;
        }

        return {
          questionId,
          answerText
        };
      });

      const result = await testService.submitTest(test.id, studentId, formattedAnswers);
      setSubmissionResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitted(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading test...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">No questions available for this test.</p>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800">Go Back</button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults && submissionResult) {
    const score = submissionResult.correctCount ?? 0;
    const total = submissionResult.totalQuestions ?? questions.length;
    // Calculate percentage based on correct questions / total questions
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className={`inline-block p-4 rounded-full mb-4 ${percentage >= 70 ? 'bg-green-100' : 'bg-orange-100'
              }`}>
              {percentage >= 70 ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <AlertCircle className="w-12 h-12 text-orange-600" />
              )}
            </div>
            <h2 className="text-gray-900 mb-2">Test Submitted Successfully!</h2>
            <p className="text-gray-600">{test.title}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-gray-900 mb-4">Your Results</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Score</p>
                <p className="text-gray-900">
                  {score} / {total}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Percentage</p>
                <p className="text-gray-900">{percentage}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${percentage >= 70 ? 'bg-green-600' : 'bg-orange-600'
                  }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm">
              <strong>Note:</strong> These results are for auto-graded questions (MCQ) only. Text answers will be graded by your instructor.
            </p>
          </div>

          {/* Review Answers Section */}
          {submissionResult.answerDetails && submissionResult.answerDetails.length > 0 && (
            <div className="mb-6">
              <h3 className="text-gray-900 mb-4">Review Your Answers</h3>
              <div className="space-y-4">
                {submissionResult.answerDetails.map((detail: any, index: number) => {
                  const question = questions.find(q => q.id === detail.questionId);
                  if (!question) return null;

                  const isCorrect = detail.isCorrect;
                  const userAnswerIndex = question.type === 'mcq'
                    ? ['A', 'B', 'C', 'D'].indexOf(detail.userAnswer)
                    : -1;
                  const correctAnswerIndex = question.type === 'mcq'
                    ? ['A', 'B', 'C', 'D'].indexOf(detail.correctAnswer)
                    : -1;

                  return (
                    <div
                      key={detail.questionId}
                      className={`border-2 rounded-lg p-4 ${isCorrect === true
                          ? 'border-green-200 bg-green-50'
                          : isCorrect === false
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect === true ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                        ) : isCorrect === false ? (
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">Question {index + 1}</p>
                          <p className="text-gray-900 mb-3">{question.question}</p>

                          {question.type === 'mcq' && (
                            <div className="space-y-2">
                              {question.options.map((option: string, optIdx: number) => (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded ${optIdx === correctAnswerIndex && optIdx === userAnswerIndex
                                      ? 'bg-green-100 border border-green-300'
                                      : optIdx === correctAnswerIndex
                                        ? 'bg-green-100 border border-green-300'
                                        : optIdx === userAnswerIndex
                                          ? 'bg-red-100 border border-red-300'
                                          : 'bg-white border border-gray-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">{option}</span>
                                    {optIdx === correctAnswerIndex && (
                                      <span className="text-xs text-green-700 font-medium">✓ Correct</span>
                                    )}
                                    {optIdx === userAnswerIndex && optIdx !== correctAnswerIndex && (
                                      <span className="text-xs text-red-700 font-medium">✗ Your answer</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'text' && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                              <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                {detail.userAnswer || '(No answer provided)'}
                              </p>
                              <p className="text-xs text-blue-600 mt-2">Pending manual grading</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div >
    );
  }

  const question = questions[currentQuestion];
  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Exit Test
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-2">{test.courseName} - Test</h2>
            <p className="text-gray-600 text-sm">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-900">
            {answeredQuestions} / {totalQuestions} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                {question.type === 'mcq' ? 'Multiple Choice' : 'Text Answer'}
              </span>
              <span className="text-sm text-gray-600">{question.points} points</span>
            </div>
            <h3 className="text-xl text-gray-900 mb-6">{question.question}</h3>
          </div>
        </div>

        {/* MCQ Options */}
        {question.type === 'mcq' && (
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => (
              <label
                key={index}
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${answers[question.id] === index
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answers[question.id] === index}
                  onChange={() => handleMCQAnswer(question.id, index)}
                  className="mt-1"
                />
                <span className="flex-1 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Text Answer */}
        {question.type === 'text' && (
          <div>
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleTextAnswer(question.id, e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your answer here..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Provide a detailed answer. This will be manually graded by your instructor.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {/* Question Dots */}
        <div className="flex gap-2">
          {questions.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full text-xs ${currentQuestion === index
                ? 'bg-blue-600 text-white'
                : answers[questions[index].id] !== undefined
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center gap-2"
          >
            {isSubmitted ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Test
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
