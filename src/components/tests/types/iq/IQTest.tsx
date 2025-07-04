import React, { useCallback, useEffect } from 'react';
import Confetti, { useConfetti } from '../../../common/effects/Confetti';
import CongratulationsPopup, { type UserInfo } from '../../../common/popups/CongratulationsPopup';
import TimeUpPopup from '../../../common/popups/TimeUpPopup';
import TestProgressPopup from '../../../common/popups/TestProgressPopup';
import { EyeRestPopup } from '../../../common/popups';
import { motion } from 'framer-motion';

// Import components đã tách
import { IQQuestion, IQNavigation, IQProgressHeader } from './components';
import Timer from '../../core/Timer';

// Import hooks đã tách
import { 
  useIQSounds, 
  useIQKeyboardNavigation,
  useIQSaveProgress,
  useIQQuestionManager,
  useIQPopups,
  useIQTimer,
  useIQEyeRest
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
  
  // Dark Mode
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  // Hook âm thanh
  const { playSound } = useIQSounds();
  
  // State khác - di chuyển lên trước hook useIQQuestionManager
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isReviewMode, setIsReviewMode] = React.useState(false);
  const [isDataLoaded, setIsDataLoaded] = React.useState(!startImmediately);
  const [hasStarted, setHasStarted] = React.useState(startImmediately); // Theo dõi trạng thái bài test đã bắt đầu
  
  // Trạng thái savedState để lưu trữ tiến độ đã lưu
  const [savedState, setSavedState] = React.useState(loadTestState());
  
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
    setTimeElapsed,
    startTime,
    setStartTime,
    startTimer,
    pauseTimer,
    resetTimer
  } = useIQTimer({
    timeLimit,
    initialTimeElapsed: savedState ? savedState.timeElapsed : 0,
    onTimeUp: handleTimeUp,
    isActive: startImmediately
  });

  // Hook quản lý nghỉ mắt
  const {
    showRestPopup,
    isResting,
    restTimeRemaining,
    handleSkipRest,
    handleStartRest
  } = useIQEyeRest({
    isActive,
    startTime,
    restInterval: 10, // Thay đổi từ 600 (10 phút) xuống 10 giây để kiểm tra
    restDuration: 10 // Thay đổi từ 60 xuống 10 giây để kiểm tra nhanh hơn
  });
  
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
    isReviewMode,
    initialAnswers: savedState ? savedState.answers : undefined,
    initialQuestion: savedState ? savedState.currentQuestion : 0
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

  // Khởi tạo Dark Mode từ localStorage khi component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    console.log('🌙 Khởi tạo Dark Mode:', { savedTheme, prefersDark, shouldBeDark });
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  // Bắt đầu test ngay lập tức nếu startImmediately=true
  useEffect(() => {
    if (startImmediately && !hasInitializedRef.current) {
      console.log('🚀 Starting test immediately because startImmediately=true');
      hasInitializedRef.current = true;
      
      // Kiểm tra xem có trạng thái đã lưu không
      if (savedState) {
        console.log('📝 Found saved progress, resuming from question', savedState.currentQuestion + 1);
        
        // Khởi tạo lại câu hỏi và câu trả lời từ trạng thái đã lưu
        setCurrentQuestion(savedState.currentQuestion);
        setAnswers([...savedState.answers]);
        
        // Bắt đầu timer với thời gian đã trôi qua
        startTimer(savedState.timeElapsed);
      } else {
        // Bắt đầu test mới
        startTimer(0);
      }
      
      setIsDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startImmediately, savedState]);

  // Tạm dừng timer khi đang trong chế độ nghỉ mắt
  useEffect(() => {
    if (isResting && isActive) {
      // Lưu tiến độ trước khi tạm dừng
      if (startTime) {
        const currentTimeElapsed = Math.floor((Date.now() - startTime) / 1000);
        saveProgress(
          currentQuestion,
          answers,
          currentTimeElapsed
        );
        console.log(`💾 Saving progress before eye rest: ${currentQuestion + 1}/${questions.length}, time: ${currentTimeElapsed}s`);
      }
      
      // Tạm dừng timer
      pauseTimer();
      console.log('⏸️ Timer paused for eye rest');
    } else if (!isResting && !isActive && !isTimeUp && startTime) {
      // Tiếp tục timer sau khi nghỉ mắt xong
      startTimer(timeElapsed);
      console.log('▶️ Timer resumed after eye rest');
    }
  }, [isResting, isActive, isTimeUp, startTime, timeElapsed, currentQuestion, answers, questions.length, saveProgress, pauseTimer, startTimer]);

  // Thêm useEffect để lưu tiến độ định kỳ
  useEffect(() => {
    if (!isActive || !startTime) return;
    
    // Tạo interval để lưu tiến độ mỗi 10 giây
    const saveInterval = setInterval(() => {
      if (isActive && startTime) {
        const currentTimeElapsed = Math.floor((Date.now() - startTime) / 1000);
        saveProgress(
          currentQuestion,
          answers,
          currentTimeElapsed
        );
        console.log(`⏱️ Auto-saving progress: ${currentQuestion + 1}/${questions.length}, time: ${currentTimeElapsed}s`);
      }
    }, 10000); // 10 giây
    
    return () => clearInterval(saveInterval);
  }, [isActive, startTime, currentQuestion, answers, saveProgress, questions.length]);

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
            
            // Gọi submitTest ngay lập tức không có độ trễ
            submitTest();
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [justAnswered, answers, currentQuestion, findNextUnanswered, isReviewMode, questions.length, isActive, startTime, saveProgress]);

  // Lưu trạng thái khi người dùng sắp thoát khỏi trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && startTime) {
        const currentTimeElapsed = Math.floor((Date.now() - startTime) / 1000);
        saveProgress(
          currentQuestion,
          answers,
          currentTimeElapsed
        );
        console.log(`💾 Saving progress before unload: ${currentQuestion + 1}/${questions.length}, time: ${currentTimeElapsed}s`);
        
        // Hiển thị thông báo khi người dùng thoát trang
        // Cách xử lý cho tất cả các trình duyệt hiện đại
        const message = "Dữ liệu bài test đã được lưu lại, bạn có muốn thoát không?";
        e.preventDefault();
        e.returnValue = message;
        
        // Một số trình duyệt cũ vẫn có thể sử dụng giá trị trả về
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive, startTime, currentQuestion, answers, saveProgress, questions.length]);

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

  // Toggle Dark Mode
  const toggleTheme = () => {
    console.log('🌓 Toggle Dark Mode clicked. Current state:', isDarkMode);
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    console.log('🌓 New dark mode state:', newTheme, 'Class on html:', document.documentElement.classList.contains('dark'));
  };

  // Reset confetti
  const resetConfetti = useCallback(() => {
    setShowConfetti(false);
    setIsDataLoaded(true);
  }, []);

  // Start the test - check for saved progress first
  const startTest = useCallback(() => {
    console.log('🚀 User clicked start test button');
    
    // Tự động kích hoạt chế độ toàn màn hình khi bắt đầu bài test
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Không thể vào chế độ toàn màn hình:', err);
      });
    }
    
    startTimer();
    setIsDataLoaded(true);
    setHasStarted(true);
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

  // Submit test - shows congratulations popup
  const submitTest = useCallback(() => {
    if (isSubmitting || (!allAnswered && !isReviewMode)) return;
    
    console.log('⏰ [DEBUG] submitTest: starting submission process');
    console.log('⏰ [DEBUG] Current timer state before stopping:', { isActive, timeElapsed, startTime });
    setIsSubmitting(true);
    
    // ✅ STOP TIMER COMPLETELY - GIẢI PHÁP HOÀN THIỆN
    // Cách 1: Gọi pauseTimer để dừng interval
    pauseTimer();
    console.log('⏰ [DEBUG] pauseTimer called, stopping timer interval');
    
    // Cách 2: Lưu trữ thời gian hiện tại chính xác
    const currentTimeElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : timeElapsed;
    
    // Cách 3: Thiết lập lại toàn bộ trạng thái timer để đảm bảo hoàn toàn dừng
    setIsActive(false);  // Dừng timer logic
    setStartTime(null);  // Xóa startTime để ngăn mọi tính toán thời gian
    setTimeElapsed(currentTimeElapsed); // Cập nhật thời gian đã trôi qua chính xác
    
    console.log('⏰ [DEBUG] Completely stopped timer with exact elapsed time:', currentTimeElapsed);
    
    // ✅ Xác định trạng thái thời gian
    const remainingTime = timeLimit - currentTimeElapsed;
    const hasTimeLeft = remainingTime > 0;
    console.log('⏰ [DEBUG] Time remaining check:', { remainingTime, hasTimeLeft });
    
    // Xử lý trạng thái thời gian dựa trên thời gian còn lại
    if (!hasTimeLeft) {
      // Nếu hết thời gian, đặt isTimeUp = true
      setIsTimeUp(true);
      console.log('⏰ [DEBUG] Time is up, setting isTimeUp = true');
    } else {
      // Nếu còn thời gian, KHÔNG đặt isTimeUp = true để hiện thông báo
      console.log('⏰ [DEBUG] Time remains, ensuring timer is frozen but keeping isTimeUp = false');
    }
    
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
    
    // Hiển thị popup ngay lập tức không có độ trễ
    console.log('⏰ [DEBUG] Showing congratulations popup with timer state:', { isActive: false, timeElapsed: currentTimeElapsed });
    setShowCongratulationsPopup(true);
    setIsSubmitting(false);

    // Double-check timer state after changes
    setTimeout(() => {
      console.log('⏰ [DEBUG] Timer state check after 500ms:', { 
        isActive, 
        timeElapsed, 
        startTime, 
        isTimeUp,
        remainingTime
      });
    }, 500);
  }, [isSubmitting, allAnswered, isReviewMode, pauseTimer, playSound, setIsTimeUp, setIsActive, setTimeElapsed, timeLimit, timeElapsed, startTime, setStartTime, isActive, isTimeUp]);

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

  // START SCREEN RENDERING - Chỉ hiển thị khi chưa bắt đầu bài test
  if (!hasStarted) {
    return (
      <>
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
              setIsReviewMode(true);
              setHasStarted(true);
              
              // ✅ FIX: Check if there's still time left before resuming timer
              const remainingTime = timeLimit - savedState.timeElapsed;
              if (remainingTime > 0) {
                setIsTimeUp(false);
                startTimer(savedState.timeElapsed);
                console.log('⏰ Timer resumed with', remainingTime, 'seconds remaining');
              } else {
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
        
        <div className="max-w-4xl mx-auto text-center py-20 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12 border border-gray-100 dark:border-gray-700">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-display">
                Test IQ Chuyên Nghiệp
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                Đánh giá trí tuệ với {questions.length} câu hỏi trong {Math.floor(timeLimit / 60)} phút
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl">
                  <div className="text-3xl mb-2">🧠</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tư duy logic</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Kiểm tra khả năng suy luận và phân tích</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-2xl">
                  <div className="text-3xl mb-2">⏱️</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tốc độ xử lý</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Đo lường khả năng phản xạ nhanh</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-2xl">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Phân tích chi tiết</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Báo cáo kết quả chuyên sâu</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={startTest}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Bắt Đầu Test Ngay
              </button>
              
              <button 
                onClick={toggleTheme}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle Dark Mode"
                type="button"
              >
                {isDarkMode ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Chế độ sáng
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Chế độ tối
                  </>
                )}
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Mẹo: Sử dụng phím số 1-4 để chọn đáp án nhanh chóng
            </p>
          </div>
        </div>
      </>
    );
  }

  // TEST SCREEN RENDERING
  return (
    <div className={`relative min-h-screen w-full bg-white dark:bg-gray-900 ${isResting ? 'disable-animations' : ''}`}>
      {/* Thêm style tắt animations khi đang nghỉ mắt */}
      {isResting && (
        <style dangerouslySetInnerHTML={{ __html: disableAnimationsStyle }} />
      )}
      
      {/* Hiển thị popup nghỉ mắt */}
      <EyeRestPopup
        isOpen={showRestPopup}
        onSkip={handleSkipRest}
        onStartRest={handleStartRest}
      />
      
      {/* Hiển thị thông báo đang nghỉ mắt */}
      {isResting && (
        <div className="fixed top-0 left-0 right-0 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 py-2 text-center font-medium z-50">
          Đang nghỉ mắt... Còn {restTimeRemaining} giây (Chế độ kiểm thử)
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center py-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      <Confetti trigger={showConfetti} type="light" />
      
      {/* Congratulations Popup */}
      <CongratulationsPopup 
        isOpen={showCongratulationsPopup}
        onComplete={handlePopupComplete}
        onReview={() => {
          console.log('⏰ [DEBUG] Review button clicked - preparing to resume test');
          setShowCongratulationsPopup(false);
          setIsReviewMode(true); // Enable review mode and jump to question 1
          setCurrentQuestion(0);
          
          // Kiểm tra nếu còn thời gian
          const remainingTime = timeLimit - timeElapsed;
          console.log('⏰ [DEBUG] Time check for review mode:', { timeElapsed, remainingTime });
          
          if (remainingTime > 0) {
            // ✅ Đặt các trạng thái timer chính xác để tiếp tục đếm ngược
            console.log('⏰ [DEBUG] Resuming timer with', remainingTime, 'seconds remaining');
            setIsTimeUp(false);
            setIsActive(true);  // Đảm bảo timer hiển thị là active
            
            // Tính thời gian bắt đầu chính xác dựa trên thời gian đã trôi qua
            startTimer(timeElapsed);
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

          {/* Timer - Hiển thị nổi bật ở góc phải màn hình */}
          <Timer
            initialTime={timeLimit}
            timeElapsed={timeElapsed}
            isActive={isActive}
            onTimeUp={handleTimeUp}
          />

          {/* Main test container with shadow and background */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              {/* Question Component */}
              <div>
                <IQQuestion 
                  key={`question-${currentQuestion}`}
                  question={questions[currentQuestion]}
                  currentAnswer={answers[currentQuestion]}
                  onAnswerSelect={handleAnswerSelect}
                  highlightedAnswer={highlightedAnswer}
                  justAnswered={justAnswered}
                  answersDisabled={!isActive || isTimeUp}
                  isReviewMode={isReviewMode}
                  showAnimation={true}
                  onSkip={nextQuestion}
                  onPrevious={previousQuestion}
                />
              </div>

              {/* Phần hiển thị tiến độ ở giữa trung tâm */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
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

      {/* Navigation - Luôn hiển thị nhưng chỉ áp dụng màu sắc khi dữ liệu đã được tải */}
              <div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}