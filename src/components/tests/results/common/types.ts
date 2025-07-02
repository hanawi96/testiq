// Common types for test results

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

export interface UserInfo {
  name: string; 
  email?: string; 
  age: string; 
  location: string;
}

export interface ResultComponentProps {
  results: ResultData;
  userInfo?: UserInfo | null;
  onRetake: () => void;
  onHome: () => void;
}

export interface TestHistoryItem {
  id: number;
  date: string;
  score: number;
  percentile: number;
  timeTaken: number;
  improvement: number;
  isFirst?: boolean;
  isCurrent?: boolean;
} 