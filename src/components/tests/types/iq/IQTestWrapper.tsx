import React, { useState, useCallback } from 'react';
import IQTest from './IQTest';
import ResultComponent from '../../results/ResultComponent';
import type { Question, TestResult } from '../../../../utils/test';
import { convertToResultData } from './utils/iq-result-formatter';

interface IQTestWrapperProps {
  questions: Question[];
  timeLimit: number;
  startImmediately?: boolean;
}

export default function IQTestWrapper({ questions, timeLimit, startImmediately = false }: IQTestWrapperProps) {
  const [result, setResult] = useState<TestResult | null>(null);

  const handleComplete = useCallback((testResult: TestResult) => {
    setResult(testResult);
  }, []);

  const handleRetake = useCallback(() => {
    setResult(null);
    // Chuyển hướng đến trang bắt đầu test
    window.location.href = '/test/iq/start';
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