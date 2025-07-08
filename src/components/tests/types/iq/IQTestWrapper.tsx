import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import IQTest from './IQTest';
import TestProgressPopup from '../../../common/popups/TestProgressPopup';
import ResultComponent from '../../results/ResultComponent';
import type { Question, TestResult } from '../../../../utils/testing/iq-test/core';
import { convertToResultData } from './utils/iq-result-formatter';
import {
  hasInProgressTest,
  getInProgressTestInfo,
  clearTestState,
  loadTestState
} from '../../../../utils/testing/iq-test/state';

interface IQTestWrapperProps {
  questions: Question[];
  timeLimit: number;
  startImmediately?: boolean;
}

export default function IQTestWrapper({ questions, timeLimit, startImmediately = false }: IQTestWrapperProps) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [shouldRender, setShouldRender] = useState<boolean>(startImmediately);
  const [showProgressPopup, setShowProgressPopup] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<{
    currentQuestion: number;
    totalQuestions: number;
    timeRemaining: number;
    daysAgo: number;
    answeredQuestions: number;
  } | null>(null);
  
  // Ref để kiểm tra xem component đã mount chưa
  const isMounted = useRef<boolean>(false);

  // Thêm/xóa class fullscreen-test vào body khi test bắt đầu/kết thúc
  useEffect(() => {
    const headerElement = document.querySelector('header');
    const footerElement = document.querySelector('footer');

    if (shouldRender && !result) {
      // Khi bắt đầu test, thêm class để ẩn header và footer
      document.body.classList.add('fullscreen-test');
      
      // Ẩn trực tiếp header và footer
      if (headerElement) {
        headerElement.style.display = 'none';
      }
      
      if (footerElement) {
        footerElement.style.display = 'none';
      }
    } else {
      // Khi kết thúc test hoặc chưa bắt đầu, xóa class
      document.body.classList.remove('fullscreen-test');
      
      // Hiển thị lại header và footer
      if (headerElement) {
        headerElement.style.display = '';
      }
      
      if (footerElement) {
        footerElement.style.display = '';
      }
    }
    
    return () => {
      // Cleanup: đảm bảo xóa class khi component unmount
      document.body.classList.remove('fullscreen-test');
      
      // Hiển thị lại header và footer khi unmount
      if (headerElement) {
        headerElement.style.display = '';
      }
      
      if (footerElement) {
        footerElement.style.display = '';
      }
    };
  }, [shouldRender, result]);

  // Xử lý event từ button "Bắt đầu Test"
  useEffect(() => {
    const handleCheckInProgress = () => {
      if (hasInProgressTest()) {
        // Có bài test đang làm dở, lấy thông tin và hiển thị popup
        const testInfo = getInProgressTestInfo();
        if (testInfo) {
          setProgressInfo(testInfo);
          setShowProgressPopup(true);
        }
      } else {
        // Không có bài test đang làm dở, bắt đầu bài test mới ngay
        startNewTest();
      }
    };

    // Đăng ký event listener
    document.addEventListener('check-in-progress-test', handleCheckInProgress);
    isMounted.current = true;

    // Cleanup
    return () => {
      document.removeEventListener('check-in-progress-test', handleCheckInProgress);
    };
  }, []);

  // Xử lý khi người dùng muốn bắt đầu bài test mới
  const startNewTest = useCallback(() => {
    // Xóa trạng thái cũ nếu có
    clearTestState();

    // Ẩn phần intro
    const introSection = document.getElementById('intro-section');
    if (introSection) introSection.style.display = 'none';

    // Hiển thị phần test
    const testSection = document.getElementById('test-section');
    if (testSection) testSection.style.display = 'block';

    // Cho phép render test
    setShouldRender(true);
    setShowProgressPopup(false);
  }, []);

  // Xử lý khi người dùng muốn tiếp tục bài test dang dở
  const continueTest = useCallback(() => {
    // Ẩn phần intro
    const introSection = document.getElementById('intro-section');
    if (introSection) introSection.style.display = 'none';

    // Hiển thị phần test
    const testSection = document.getElementById('test-section');
    if (testSection) testSection.style.display = 'block';

    // Cho phép render test
    setShouldRender(true);
    setShowProgressPopup(false);
  }, []);

  // Callback xử lý khi hoàn thành bài test
  const handleComplete = useCallback((testResult: TestResult) => {
    // Nếu có kết quả, chuyển qua màn hình hiển thị kết quả
    setResult(testResult);
  }, []);

  // Callback xử lý khi muốn làm lại bài test
  const handleRetake = useCallback(() => {
    // Reset kết quả để hiển thị lại bài test
    setResult(null);
    
    // Xóa trạng thái cũ
    clearTestState();
    
    // Quay về trang intro thay vì reset lại test
    window.location.href = '/test/iq';
  }, []);

  const handleHome = useCallback(() => {
    window.location.href = '/';
    // Xóa trạng thái đã bắt đầu test
    clearTestState();
  }, []);

  // Render popup trong portal nếu cần
  const renderProgressPopup = () => {
    if (!isMounted.current || !showProgressPopup || !progressInfo) return null;

    const container = document.getElementById('progress-popup-container');
    if (!container) return null;

    return createPortal(
      <TestProgressPopup
        isOpen={showProgressPopup}
        questionNumber={progressInfo.currentQuestion}
        totalQuestions={progressInfo.totalQuestions}
        answeredQuestions={progressInfo.answeredQuestions}
        timeRemaining={progressInfo.timeRemaining}
        daysAgo={progressInfo.daysAgo}
        onContinue={continueTest}
        onRestart={startNewTest}
      />,
      container
    );
  };

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
  return (
    <>
      {shouldRender && (
        <IQTest
          questions={questions}
          timeLimit={timeLimit}
          onComplete={handleComplete}
          startImmediately={true}
        />
      )}
      {renderProgressPopup()}
    </>
  );
} 