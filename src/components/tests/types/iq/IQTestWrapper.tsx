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
  // Thêm ref để theo dõi việc khởi tạo
  const isInitializedRef = useRef(false);
  // Thêm state để kiểm soát việc render
  const [shouldRender, setShouldRender] = useState(false);

  // Kiểm tra và đảm bảo component chỉ được khởi tạo một lần
  useEffect(() => {
    // Sử dụng setTimeout để đảm bảo React đã được khởi tạo đầy đủ
    const timer = setTimeout(() => {
      if (!isInitializedRef.current) {
        console.log('🔄 IQTestWrapper: First initialization');
        isInitializedRef.current = true;
        
        // Chỉ tự động render nếu startImmediately=true
        // hoặc nếu người dùng đã bấm nút bắt đầu test
        if (startImmediately || sessionStorage.getItem('iq_test_started') === 'true') {
          setShouldRender(true);
        }
        
        // Đặt flag để tránh khởi tạo lại khi hot-reload
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem('iq_test_initialized', 'true');
          }
        } catch (e) {
          console.error('Error accessing sessionStorage:', e);
        }
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [startImmediately]);

  const handleComplete = useCallback((testResult: TestResult) => {
    setResult(testResult);
  }, []);

  const handleRetake = useCallback(() => {
    setResult(null);
    // Chuyển hướng đến trang bắt đầu test
    window.location.href = '/test/iq';
    // Xóa trạng thái đã bắt đầu test
    sessionStorage.removeItem('iq_test_started');
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