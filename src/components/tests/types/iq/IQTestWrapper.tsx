import React, { useState, useCallback } from 'react';
import IQTest from './tests/IQTest';
import ResultComponent from './tests/ResultComponent';
import type { Question, TestResult } from '../utils/test';

interface IQTestWrapperProps {
  questions: Question[];
  timeLimit: number;
  startImmediately?: boolean;
}

// Convert TestResult to ResultData format
function convertToResultData(result: TestResult, questions: Question[], timeLimit: number) {
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

function getClassificationLevel(classification: string): string {
  const levels: Record<string, string> = {
    'genius': 'Thiên tài',
    'very_superior': 'Rất cao',
    'superior': 'Cao',
    'high_average': 'Khá cao',
    'average': 'Trung bình',
    'low_average': 'Dưới trung bình',
    'borderline': 'Thấp',
    'low': 'Rất thấp'
  };
  return levels[classification] || 'Trung bình';
}

function getClassificationColor(classification: string): string {
  const colors: Record<string, string> = {
    'genius': 'purple',
    'very_superior': 'blue',
    'superior': 'green',
    'high_average': 'green',
    'average': 'yellow',
    'low_average': 'orange',
    'borderline': 'red',
    'low': 'red'
  };
  return colors[classification] || 'yellow';
}

function getClassificationDescription(classification: string): string {
  const descriptions: Record<string, string> = {
    'genius': 'Chỉ số IQ vượt trội',
    'very_superior': 'Trí thông minh vượt trội',
    'superior': 'Trên mức trung bình cao',
    'high_average': 'Trên mức trung bình',
    'average': 'Mức trung bình',
    'low_average': 'Dưới mức trung bình',
    'borderline': 'Cần cải thiện',
    'low': 'Cần cải thiện nhiều'
  };
  return descriptions[classification] || 'Mức trung bình';
}

export default function IQTestWrapper({ questions, timeLimit, startImmediately = false }: IQTestWrapperProps) {
  const [result, setResult] = useState<TestResult | null>(null);

  const handleComplete = useCallback((testResult: TestResult) => {
    setResult(testResult);
  }, []);

  const handleRetake = useCallback(() => {
    setResult(null);
    // Reload trang để làm lại test
    window.location.reload();
  }, []);

  const handleHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  if (result) {
    const resultData = convertToResultData(result, questions, timeLimit);
    return (
      <ResultComponent
        results={resultData}
        onRetake={handleRetake}
        onHome={handleHome}
      />
    );
  }

  return (
    <IQTest
      questions={questions}
      timeLimit={timeLimit}
      onComplete={handleComplete}
      startImmediately={startImmediately}
    />
  );
} 