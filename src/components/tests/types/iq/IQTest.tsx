import React, { useCallback, useEffect } from 'react';
import Confetti, { useConfetti } from '../../../common/effects/Confetti';
import CongratulationsPopup, { type UserInfo } from '../../../common/popups/CongratulationsPopup';
import TimeUpPopup from '../../../common/popups/TimeUpPopup';
import TestProgressPopup from '../../../common/popups/TestProgressPopup';
import CompletedTestPopup from '../../../common/popups/CompletedTestPopup';

// Import components đã tách
import { IQQuestion, IQNavigation, IQProgressHeader } from './components';

// Import hooks đã tách
import { 
  useIQSounds, 
  useIQKeyboardNavigation,
  useIQSaveProgress,
  useIQQuestionManager,
  useIQPopups,
  useIQTimer
} from './hooks';

import type { Question, TestResult } from '../../../../utils/test';
import { generateTestResult, saveTestResult } from '../../../../utils/test';
import { loadTestState } from '../../../../utils/test-state';

// CSS cho việc tắt animations
const disableAnimationsStyle = `
.disable-animations * {
  animation: none !important;
  transition: none !important;
}
`;

interface IQTestProps {
  questions: Question[];
  timeLimit: number; // in seconds
  onComplete: (result: TestResult) => void;
  startImmediately?: boolean; // Thêm prop này để bắt đầu test ngay lập tức
}

export default function IQTest({ questions, timeLimit, onComplete, startImmediately = false }: IQTestProps) {
  // ===== HOOKS =====
  
  // Hook âm thanh
  const { playSound } = useIQSounds();
  
  // Hook quản lý popups
  const { 
    showConfetti,
    setShowConfetti,
    confettiTriggered,
    showCongratulationsPopup,
    setShowCongratulationsPopup,
    showTimeUpPopup, 
    setShowTimeUpPopup,
    showProgressPopup,
    setShowProgressPopup,
    showCompletedTestPopup,
    setShowCompletedTestPopup,
    isTimeUp,
    setIsTimeUp,
    savedProgress,
    setSavedProgress,
    savedTimeRemaining,
    setSavedTimeRemaining,
    preloadedUserInfo,
    isAuthenticatedUser,
    handleTimeUp,
    handleConfettiTrigger,
    resetPopupStates
  } = useIQPopups({ playSound });
  
  // Hook quản lý thời gian
  const {
    isActive,
    setIsActive,
    timeElapsed,
    startTime,
    setStartTime,
    startTimer,
    pauseTimer,
    resetTimer
  } = useIQTimer({
    timeLimit,
    onTimeUp: handleTimeUp,
    isActive: startImmediately
  });
  
  // State khác - di chuyển lên trước hook useIQQuestionManager
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isReviewMode, setIsReviewMode] = React.useState(false);
  const [isDataLoaded, setIsDataLoaded] = React.useState(!startImmediately);
  
  // Hook quản lý câu hỏi và trả lời
  const {
    currentQuestion,
    setCurrentQuestion,
    answers,
    setAnswers,
    justAnswered,
    setJustAnswered,
    highlightedAnswer,
    setHighlightedAnswer,
    allAnswered,
    handleAnswerSelect,
    nextQuestion,
    previousQuestion,
    jumpToQuestion,
    resetQuestionState,
    findNextUnanswered
  } = useIQQuestionManager({
    questions,
    playSound,
    isTimeUp,
    isReviewMode
  });
  
  // Hook quản lý lưu tiến trình
  const {
    saveProgress,
    clearProgress
  } = useIQSaveProgress({ questions, timeLimit });
  
  // Hook điều hướng bàn phím
  useIQKeyboardNavigation({
    onAnswerSelect: handleAnswerSelect,
    totalAnswers: questions[currentQuestion]?.options.length || 4,
    onNextQuestion: nextQuestion,
    onPrevQuestion: previousQuestion,
    isActive: true, // Luôn kích hoạt tính năng điều hướng bàn phím
    highlightedAnswer: highlightedAnswer,
    setHighlightedAnswer: setHighlightedAnswer
  });
  
  // Hook hiệu ứng confetti
  const { fireSingle } = useConfetti();
  
  // Ref để đảm bảo useEffect chỉ chạy một lần
  const hasInitializedRef = React.useRef(false);

  // ===== SIDE EFFECTS =====

  // Bắt đầu test ngay lập tức nếu startImmediately=true
  useEffect(() => {
    if (startImmediately && !hasInitializedRef.current) {
      console.log('🚀 Starting test immediately because startImmediately=true');
      hasInitializedRef.current = true;
      
      // Bắt đầu test ngay lập tức
      startTimer(0);
      setIsDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startImmediately]);

  // Smart auto-advance logic + Auto show review popup when all answered
  useEffect(() => {
    if (justAnswered && answers[currentQuestion] !== null) {
      const timer = setTimeout(() => {
        if (isReviewMode) {
          // In review mode: simply go to next question (regardless of answered status)
          const nextQuestion = currentQuestion + 1;
          if (nextQuestion < questions.length) {
            setCurrentQuestion(nextQuestion);
            
            // Save state immediately when auto-advancing in review mode
            if (isActive && startTime) {
              saveProgress(
                nextQuestion,
                answers,
                Math.floor((Date.now() - startTime) / 1000)
              );
              console.log('💾 Saved state after auto-advancing to question', nextQuestion + 1);
            }
          }
          setJustAnswered(false);
        } else {
          // Normal mode: find next unanswered question
          const nextUnanswered = findNextUnanswered(currentQuestion + 1);
          console.log('auto-advance: currentQuestion =', currentQuestion, ', nextUnanswered =', nextUnanswered);
          if (nextUnanswered !== -1) {
            setCurrentQuestion(nextUnanswered);
            
            // Save state immediately when auto-advancing
            if (isActive && startTime) {
              saveProgress(
                nextUnanswered,
                answers,
                Math.floor((Date.now() - startTime) / 1000)
              );
              console.log('💾 Saved state after auto-advancing to question', nextUnanswered + 1);
            }
            
            setJustAnswered(false);
          } else {
            // All questions answered - auto submit
            setJustAnswered(false);
            
            // ✅ FIX: Đợi một frame để đảm bảo tiến trình đã được cập nhật trước khi hiển thị popup
            requestAnimationFrame(() => {
              submitTest();
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [justAnswered, answers, currentQuestion, findNextUnanswered, isReviewMode, questions.length, isActive, startTime, saveProgress]);

  // Thêm listener theo dõi phím ấn toàn cục để debug
  useEffect(() => {
    const debugKeyPress = (e: KeyboardEvent) => {
      console.log('🔍 DEBUG - Key pressed:', e.key);
    };
    
    window.addEventListener('keydown', debugKeyPress);
    return () => {
      window.removeEventListener('keydown', debugKeyPress);
    };
  }, []);

  // ===== CALLBACKS =====

  // Reset confetti
  const resetConfetti = useCallback(() => {
    setShowConfetti(false);
    setIsDataLoaded(true);
  }, []);

  // Start the test - check for saved progress first
  const startTest = useCallback(() => {
    console.log('🚀 User clicked start test button');
    startTimer();
    setIsDataLoaded(true);
    resetConfetti();
  }, [startTimer, resetConfetti]);

  // Restart test (clear saved state and start fresh)
  const restartTest = useCallback(() => {
    console.log('🔄 Restarting test from popup - clearing saved state');
    clearProgress();
    resetQuestionState();
    resetPopupStates();
    startTimer(0);
    setIsDataLoaded(true);
  }, [clearProgress, resetQuestionState, resetPopupStates, startTimer]);

  // ✅ OPTIMIZED: Centralized fresh test restart logic for reusability
  const restartFreshTest = useCallback(() => {
    console.log('🔄 Starting fresh test from scratch');
    
    // Ngăn nhảy footer bằng cách tạm thời tắt animation popup
    document.body.classList.add('disable-animations');
    
    // Thêm style tag nếu chưa có
    if (!document.getElementById('disable-animations-style')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'disable-animations-style';
      styleTag.innerHTML = disableAnimationsStyle;
      document.head.appendChild(styleTag);
    }
    
    // ✅ STEP 1: Stop all audio immediately - siêu nhanh
    playSound('complete');
    
    // ✅ STEP 2: Clear states and storage - KHÔNG DÙNG BATCH
    clearProgress(); // Clear any saved progress
    
    // ✅ STEP 3: Tạm dừng tất cả các hiệu ứng
    pauseTimer();
    
    // ✅ STEP 4: Sử dụng requestAnimationFrame để đảm bảo tất cả thay đổi đã được áp dụng
    requestAnimationFrame(() => {
      // Reset timer
      resetTimer();
      // Reset question state
      resetQuestionState();
      
      // Gọi setTimeout để đảm bảo React đã render với state mới
      setTimeout(() => {
        // Reset popup state
        resetPopupStates();
        setIsReviewMode(false);
        setIsSubmitting(false);
        
        // Gọi thêm một requestAnimationFrame để đảm bảo tất cả state đã được áp dụng
        requestAnimationFrame(() => {
          startTimer(0);
          setIsDataLoaded(true);
          
          // Sau khi tất cả đã render xong, bật lại animation
          setTimeout(() => {
            document.body.classList.remove('disable-animations');
          }, 100);
        });
      }, 50);
    });
    
  }, [
    playSound, clearProgress, pauseTimer, resetTimer, 
    resetQuestionState, resetPopupStates, startTimer
  ]);

  // View result from completed saved test
  const viewSavedResult = useCallback(() => {
    setShowProgressPopup(false);
    setShowCongratulationsPopup(true);
  }, []);

  // Handle completed test popup actions
  const handleCompletedTestViewResult = useCallback(() => {
    setShowCompletedTestPopup(false);
    setShowCongratulationsPopup(true);
  }, []);

  const handleCompletedTestRestart = useCallback(() => {
    setShowCompletedTestPopup(false);
    restartFreshTest();
  }, [restartFreshTest]);

  // Submit test - shows congratulations popup
  const submitTest = useCallback(() => {
    if (isSubmitting || !allAnswered) return;
    
    console.log('submitTest: starting submission process');
    setIsSubmitting(true);
    
    // ✅ STOP TIMER IMMEDIATELY when user clicks Complete
    pauseTimer();
    
    // ✅ Play completion sound
    playSound('complete');
    
    // ✅ SMART: Mark as completed but keep state for "view result" option
    const currentState = loadTestState();
    if (currentState) {
      const completedState = {
        ...currentState,
        isCompleted: true,
        completedAt: Date.now()
      };
      localStorage.setItem('iq_test_state', JSON.stringify(completedState));
      console.log('💾 Marked test as completed, keeping state for result viewing');
    }
    
    // ✅ FIX: Đảm bảo thanh tiến trình cập nhật đến 100% trước khi hiển thị popup
    // Sử dụng requestAnimationFrame và setTimeout để tạo độ trễ nhỏ cho phép render
    requestAnimationFrame(() => {
      // Độ trễ nhỏ để đảm bảo thanh tiến trình đã được cập nhật
      setTimeout(() => {
        console.log('submitTest: showing congratulations popup');
        setShowCongratulationsPopup(true);
        setIsSubmitting(false);
      }, 50);
    });
  }, [isSubmitting, allAnswered, pauseTimer, playSound]);

  // Handle popup completion
  const handlePopupComplete = useCallback(async (userInfo: UserInfo) => {
    // Check if we're completing from saved state
    const savedState = loadTestState();
    let timeSpent, filledAnswers;
    
    if (savedState && isTimeUp) {
      // Completing from saved completed test
      timeSpent = savedState.timeElapsed;
      filledAnswers = savedState.answers.map(answer => answer ?? -1);
      console.log('⏱️ Completing saved test - timeSpent:', timeSpent, 'seconds');
    } else {
      // Normal completion
      timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      filledAnswers = answers.map(answer => answer ?? -1);
      console.log('⏱️ Normal completion - timeSpent:', timeSpent, 'seconds');
    }
    
    // Luôn bỏ qua kiểm tra đáp án đúng/sai
    const result = generateTestResult(questions, filledAnswers, timeSpent, true);
    
    // Add user info to result
    const resultWithUserInfo = {
      ...result,
      userInfo
    };
    
    // Save to Supabase and localStorage
    await saveTestResult(resultWithUserInfo);
    
    // ✅ SMART: Clear saved state only when user actually views result
    clearProgress();
    console.log('🗑️ Cleared test state after user viewed result');
    
    onComplete(resultWithUserInfo);
  }, [answers, questions, startTime, onComplete, clearProgress]);

  // ===== RENDERING =====

  // START SCREEN RENDERING
  if (!isActive && !startTime) {
    return (
      <>
        {/* Completed Test Popup - for tests that are done but not submitted */}
        <CompletedTestPopup 
          isOpen={showCompletedTestPopup}
          onViewResult={handleCompletedTestViewResult}
          onRestart={handleCompletedTestRestart}
        />
        
        {/* Congratulations Popup - for entering user info and viewing results */}
        <CongratulationsPopup 
          isOpen={showCongratulationsPopup}
          onComplete={handlePopupComplete}
          onReview={() => {
            setShowCongratulationsPopup(false);
            // ✅ FIX: Load saved state and enter review mode
            const savedState = loadTestState();
            if (savedState) {
              setCurrentQuestion(savedState.currentQuestion);
              setAnswers(savedState.answers);
              startTimer(savedState.timeElapsed);
              setIsReviewMode(true);
              
              // ✅ FIX: Check if there's still time left before resuming timer
              const remainingTime = timeLimit - savedState.timeElapsed;
              if (remainingTime <= 0) {
                setIsTimeUp(true);
                pauseTimer();
                console.log('⏰ Time already up - not resuming timer');
              }
              
              console.log('✅ Entering review mode from saved state');
            }
          }}
          onConfettiTrigger={handleConfettiTrigger}
          preloadedUserInfo={preloadedUserInfo}
          isAuthenticatedUser={isAuthenticatedUser}
          remainingTimeSeconds={(() => {
            const savedState = loadTestState();
            if (savedState) {
              const remaining = timeLimit - savedState.timeElapsed;
              return remaining > 0 ? remaining : undefined;
            }
            return undefined;
          })()}
        />
        
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
                Test IQ Chuyên Nghiệp
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Đánh giá trí tuệ với {questions.length} câu hỏi trong {Math.floor(timeLimit / 60)} phút
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-2xl">
                  <div className="text-3xl mb-2">🧠</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Tư duy logic</h3>
                  <p className="text-sm text-gray-600">Kiểm tra khả năng suy luận và phân tích</p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl">
                  <div className="text-3xl mb-2">⏱️</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Tốc độ xử lý</h3>
                  <p className="text-sm text-gray-600">Đo lường khả năng phản xạ nhanh</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phân tích chi tiết</h3>
                  <p className="text-sm text-gray-600">Báo cáo kết quả chuyên sâu</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={startTest}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Bắt Đầu Test Ngay
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Mẹo: Sử dụng phím số 1-4 để chọn đáp án nhanh chóng
            </p>
          </div>
        </div>
      </>
    );
  }

  // TEST SCREEN RENDERING
  return (
    <div className="max-w-4xl mx-auto py-20">
      <Confetti trigger={showConfetti} type="light" />
      
      {/* Congratulations Popup */}
      <CongratulationsPopup 
        isOpen={showCongratulationsPopup}
        onComplete={handlePopupComplete}
        onReview={() => {
          setShowCongratulationsPopup(false);
          setIsReviewMode(true); // Enable review mode and jump to question 1
          setCurrentQuestion(0);
          
          // ✅ FIX: Keep timer running if there's still time left
          if (!isTimeUp) {
            startTimer(timeElapsed);
            console.log('⏰ Timer resumed for review mode');
          }
        }}
        onConfettiTrigger={handleConfettiTrigger}
        preloadedUserInfo={preloadedUserInfo}
        isAuthenticatedUser={isAuthenticatedUser}
        remainingTimeSeconds={!isTimeUp ? Math.max(0, timeLimit - timeElapsed) : undefined}
      />
      
      {/* Time Up Popup */}
      <TimeUpPopup 
        isOpen={showTimeUpPopup}
        onComplete={handlePopupComplete}
        onRetakeTest={() => {
          setShowTimeUpPopup(false);
          restartFreshTest();
        }}
        preloadedUserInfo={preloadedUserInfo}
        isAuthenticatedUser={isAuthenticatedUser}
      />

      {/* Progress Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 relative overflow-hidden">
        <IQProgressHeader 
          currentQuestion={currentQuestion}
          totalQuestions={questions.length}
          timeElapsed={timeElapsed}
          timeLimit={timeLimit}
          isActive={isActive}
          onTimeUp={handleTimeUp}
          answers={answers}
        />
      </div>

      {/* Question Component */}
      <IQQuestion 
        key={`question-${currentQuestion}`}
        question={questions[currentQuestion]}
        currentAnswer={answers[currentQuestion]}
        onAnswerSelect={handleAnswerSelect}
        highlightedAnswer={highlightedAnswer}
        justAnswered={justAnswered}
        answersDisabled={!isActive || isTimeUp}
        showAnimation={true}
      />

      {/* Navigation - Luôn hiển thị nhưng chỉ áp dụng màu sắc khi dữ liệu đã được tải */}
      <IQNavigation 
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        answers={answers}
        onPrevious={previousQuestion}
        onNext={nextQuestion}
        onJumpToQuestion={jumpToQuestion}
        onSubmit={submitTest}
        isSubmitting={isSubmitting}
        isReviewMode={isReviewMode}
        allAnswered={allAnswered}
        isDataLoaded={isDataLoaded}
      />
    </div>
  );
}