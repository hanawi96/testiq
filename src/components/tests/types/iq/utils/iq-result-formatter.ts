/**
 * Hàm tiện ích để chuyển đổi dữ liệu kết quả cho IQ test
 */

import { getClassificationColor, getClassificationDescription, getClassificationLevel } from './iq-calculation';
import type { Question, TestResult } from '../../../../../utils/test';

// Định nghĩa kiểu ResultData
export interface ResultData {
  score: number;
  rawScore: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  percentile: number;
  classification: {
    level: string;
    color: string;
    description: string;
  };
  timeTaken: number;
  timeLimit: number;
  answerDetails: Array<{
    questionId: number;
    question: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
    points: number;
    maxPoints: number;
    difficulty: string;
    type: string;
  }>;
  completionRate: number;
}

/**
 * Chuyển đổi TestResult sang định dạng ResultData phù hợp với ResultComponent
 */
export function convertToResultData(result: TestResult, questions: Question[], timeLimit: number): ResultData {
  return {
    score: result.iq,
    rawScore: result.score,
    maxScore: questions.length,
    correctAnswers: result.detailed.correct,
    totalQuestions: questions.length,
    percentile: result.percentile,
    classification: {
      level: getClassificationLevel(result.classification),
      color: getClassificationColor(result.classification),
      description: getClassificationDescription(result.classification)
    },
    timeTaken: result.timeSpent,
    timeLimit: timeLimit,
    answerDetails: questions.map((q, index) => ({
      questionId: q.id,
      question: q.question,
      userAnswer: result.answers[index],
      correctAnswer: q.correct,
      isCorrect: result.answers[index] === q.correct,
      explanation: q.explanation,
      points: result.answers[index] === q.correct ? 1 : 0,
      maxPoints: 1,
      difficulty: q.difficulty,
      type: q.type
    })),
    completionRate: result.detailed.accuracy
  };
} 