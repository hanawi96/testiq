import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  
  // Effect để kiểm tra xem có nên render component hay không
  useEffect(() => {
    // Với URL mới (/test/iq/start), luôn render
    setShouldRender(true);
  }, []);

  // Callback xử lý khi hoàn thành bài test
  const handleComplete = useCallback((testResult: TestResult) => {
    // Nếu có kết quả, chuyển qua màn hình hiển thị kết quả
    setResult(testResult);
    
    // Xóa trạng thái đã bắt đầu test khỏi sessionStorage (không cần thiết với URL mới)
    sessionStorage.removeItem('iq_test_started');
  }, []);

  // Callback xử lý khi muốn làm lại bài test
  const handleRetake = useCallback(() => {
    // Reset kết quả để hiển thị lại bài test
    setResult(null);
    
    // Không cần dùng sessionStorage nữa do đã có URL riêng
    sessionStorage.removeItem('iq_test_started');
    
    // Quay về trang intro thay vì reset lại test
    window.location.href = '/test/iq';
  }, []);

  const handleHome = useCallback(() => {
    window.location.href = '/';
    // Xóa trạng thái đã bắt đầu test
    sessionStorage.removeItem('iq_test_started');
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

  // Chỉ render khi đã sẵn sàng
  if (!shouldRender) {
    return null;
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