import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import Confetti, { useConfetti } from '../common/Confetti';
import CongratulationsPopup, { type UserInfo } from '../common/CongratulationsPopup';
import TimeUpPopup from '../common/TimeUpPopup';
import TestProgressPopup from '../common/TestProgressPopup';
import CompletedTestPopup from '../common/CompletedTestPopup';
import type { Question, TestResult } from '../../utils/test';
import { generateTestResult, saveTestResult } from '../../utils/test';
import { saveTestState, loadTestState, clearTestState, hasInProgressTest, isTestCompleted, calculateRemainingTime } from '../../utils/test-state';

interface IQTestProps {
  questions: Question[];
  timeLimit: number; // in seconds
  onComplete: (result: TestResult) => void;
}

export default function IQTest({ questions, timeLimit, onComplete }: IQTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAnswered, setJustAnswered] = useState(false);
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [showCompletedTestPopup, setShowCompletedTestPopup] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [savedTimeRemaining, setSavedTimeRemaining] = useState(0);
  const [preloadedUserInfo, setPreloadedUserInfo] = useState<UserInfo | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  
  const { fireSingle } = useConfetti();

  // Pre-load user profile on component mount for instant popup display
  useEffect(() => {
    const preloadUserProfile = async () => {
      try {
        const { getCurrentUserInfo } = await import('../../utils/test');
        const { AuthService } = await import('../../../backend');
        
        // Check if user is authenticated
        const { user } = await AuthService.getCurrentUser();
        const isAuthenticated = !!user;
        setIsAuthenticatedUser(isAuthenticated);
        
        const userInfo = await getCurrentUserInfo();
        
        if (userInfo) {
          setPreloadedUserInfo(userInfo);
          console.log('✅ User info pre-loaded successfully:', {
            name: userInfo.name,
            email: userInfo.email ? '✅ with email' : '❌ no email',
            age: userInfo.age || 'not set',
            location: userInfo.location || 'not set',
            type: isAuthenticated ? '🔐 Authenticated User (email disabled)' : '👤 Anonymous User',
            emailFieldStatus: isAuthenticated ? '🔒 DISABLED - Cannot be changed' : '✏️ EDITABLE - Can be changed'
          });
        } else {
          console.log('📝 No user info found - user will need to enter info manually');
        }
      } catch (error) {
        console.warn('⚠️ Could not pre-load user info:', error);
      }
    };

    preloadUserProfile();
  }, []);

  // Smart navigation: find next unanswered question
  const findNextUnanswered = useCallback((fromIndex: number = 0): number => {
    // First, search from fromIndex to end
    for (let i = fromIndex; i < answers.length; i++) {
      if (answers[i] === null) return i;
    }
    // If not found and fromIndex > 0, search from beginning
    if (fromIndex > 0) {
      for (let i = 0; i < fromIndex; i++) {
        if (answers[i] === null) return i;
      }
    }
    return -1; // All answered
  }, [answers]);

  // Check if all questions are answered
  const allAnswered = answers.every(a => a !== null);

  // Reset confetti trigger when test restarts
  const resetConfetti = useCallback(() => {
    setConfettiTriggered(false);
    setShowConfetti(false);
  }, []);

  // Reset test state
  const resetTest = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(null));
    setIsActive(false);
    setStartTime(null);
    setTimeElapsed(0);
    setShowConfetti(false);
    setIsSubmitting(false);
    setJustAnswered(false);
    setShowCongratulationsPopup(false);
    setShowTimeUpPopup(false);
    setShowProgressPopup(false);
    setShowCompletedTestPopup(false);
    setSavedProgress(0);
    setSavedTimeRemaining(0);
  }, [questions.length]);

  // Don't check on mount, only when user clicks start button

  // Save state periodically when test is active
  useEffect(() => {
    if (!isActive || !startTime) return;

    const saveInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
      
      saveTestState({
        currentQuestion,
        answers,
        timeElapsed: elapsed,
        startTime,
        totalTime: timeLimit
      });
    }, 2000); // Save every 2 seconds

    return () => clearInterval(saveInterval);
  }, [isActive, startTime, currentQuestion, answers, timeLimit]);

  // Start the test - check for saved progress first
  const startTest = useCallback(() => {
    console.log('🚀 User clicked start test button');
    
    // Check for saved progress when user clicks start
    if (hasInProgressTest()) {
      const savedState = loadTestState();
      console.log('💾 Found saved state:', savedState);
      if (savedState) {
        const completedCount = savedState.answers.filter(a => a !== null).length;
        const remainingTime = Math.max(0, savedState.totalTime - savedState.timeElapsed);
        
        // Check if test is completed but not submitted
        if (isTestCompleted()) {
          // All questions answered - show completed test popup
          console.log('🎉 Test completed but not submitted - showing completed test popup');
          setShowCompletedTestPopup(true);
          return;
        } else {
          // Test in progress - show continue popup
          console.log('📝 Test in progress - showing continue option');
          setSavedProgress(completedCount);
          setSavedTimeRemaining(remainingTime);
          // Keep in start screen state but show popup
          setShowProgressPopup(true);
          return;
        }
      }
    }
    
    // No saved progress, start fresh
    console.log('🆕 Starting fresh test');
    setIsActive(true);
    setStartTime(Date.now());
    resetConfetti(); // Reset confetti state when starting new test
  }, [resetConfetti]);

  // Continue test from saved state
  const continueTest = useCallback(() => {
    const savedState = loadTestState();
    if (!savedState) {
      // No saved state, start fresh
      setIsActive(true);
      setStartTime(Date.now());
      setShowProgressPopup(false);
      return;
    }

    setCurrentQuestion(savedState.currentQuestion);
    setAnswers(savedState.answers);
    setTimeElapsed(savedState.timeElapsed);
    setStartTime(Date.now() - (savedState.timeElapsed * 1000));
    setIsActive(true);
    setShowProgressPopup(false);
    console.log('✅ Continuing test from saved state');
  }, []);

  // Restart test (clear saved state and start fresh)
  const restartTest = useCallback(() => {
    clearTestState();
    setShowProgressPopup(false);
    resetTest();
    // Start fresh test immediately
    setIsActive(true);
    setStartTime(Date.now());
  }, [resetTest]);

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
    clearTestState();
    setShowCompletedTestPopup(false);
    resetTest();
    setIsActive(true);
    setStartTime(Date.now());
  }, [resetTest]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    setJustAnswered(true);
    
    // Save state immediately when answer is selected (if test is active)
    if (isActive && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      saveTestState({
        currentQuestion,
        answers: newAnswers,
        timeElapsed: elapsed,
        startTime,
        totalTime: timeLimit
      });
      console.log('💾 Saved state after answer selection');
    }
  }, [answers, currentQuestion, isActive, startTime, timeLimit]);

  // Navigate to next question (smart navigation)
  const nextQuestion = useCallback(() => {
    const nextUnanswered = findNextUnanswered(currentQuestion + 1);
    console.log('nextQuestion: currentQuestion =', currentQuestion, ', nextUnanswered =', nextUnanswered);
    if (nextUnanswered !== -1) {
      setCurrentQuestion(nextUnanswered);
      setJustAnswered(false);
    }
  }, [currentQuestion, findNextUnanswered]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setJustAnswered(false);
    }
  }, [currentQuestion]);

  // Jump to specific question
  const jumpToQuestion = useCallback((questionIndex: number) => {
    setCurrentQuestion(questionIndex);
    setJustAnswered(false);
  }, []);

  // Submit test - shows congratulations popup
  const submitTest = useCallback(async () => {
    if (isSubmitting || !allAnswered) return;
    
    console.log('submitTest: starting submission process');
    setIsSubmitting(true);
    
    // ✅ STOP TIMER IMMEDIATELY when user clicks Complete
    setIsActive(false);
    
    // Clear saved state when submitting
    clearTestState();
    
    // Show congratulations popup after brief delay
    setTimeout(() => {
      console.log('submitTest: showing congratulations popup');
      setShowCongratulationsPopup(true);
      setIsSubmitting(false);
    }, 500);
  }, [isSubmitting, allAnswered]);

  // Handle confetti trigger when popup opens
  const handleConfettiTrigger = useCallback(() => {
    if (!confettiTriggered) {
      console.log('🎉 Triggering confetti once');
      setShowConfetti(true);
      setConfettiTriggered(true);
      
      // Reset confetti state after animation
      setTimeout(() => {
        setShowConfetti(false);
      }, 1000);
    }
  }, [confettiTriggered]);

  // Handle popup completion
  const handlePopupComplete = useCallback(async (userInfo: UserInfo) => {
    // Timer already stopped in submitTest, no need to stop again
    
    // Check if we're completing from saved state
    const savedState = loadTestState();
    let timeSpent, filledAnswers;
    
    if (savedState && isTestCompleted()) {
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
    
    const result = generateTestResult(questions, filledAnswers, timeSpent);
    
    // Add user info to result
    const resultWithUserInfo = {
      ...result,
      userInfo
    };
    
    // Save to Supabase and localStorage
    await saveTestResult(resultWithUserInfo);
    
    // Clear saved state after successful completion
    clearTestState();
    
    onComplete(resultWithUserInfo);
  }, [answers, questions, startTime, onComplete]);

  // Handle time up - shows time up popup
  const handleTimeUp = useCallback(() => {
    setIsActive(false);
    clearTestState(); // Clear saved state when time is up
    setShowTimeUpPopup(true);
  }, []);

  // Smart auto-advance logic
  useEffect(() => {
    if (justAnswered && answers[currentQuestion] !== null) {
      const timer = setTimeout(() => {
        const nextUnanswered = findNextUnanswered(currentQuestion + 1);
        console.log('auto-advance: currentQuestion =', currentQuestion, ', nextUnanswered =', nextUnanswered, ', answers =', answers.map((a, i) => `${i}:${a}`));
        if (nextUnanswered !== -1) {
          setCurrentQuestion(nextUnanswered);
          setJustAnswered(false);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [justAnswered, answers, currentQuestion, findNextUnanswered]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isActive || showCongratulationsPopup || showTimeUpPopup) return;
      
      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4':
          const answerIndex = parseInt(e.key) - 1;
          if (answerIndex < questions[currentQuestion].options.length) {
            handleAnswerSelect(answerIndex);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (answers[currentQuestion] !== null) {
            nextQuestion();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (allAnswered) {
            submitTest();
          } else if (answers[currentQuestion] !== null) {
            nextQuestion();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, currentQuestion, answers, handleAnswerSelect, nextQuestion, previousQuestion, submitTest, questions, showCongratulationsPopup, showTimeUpPopup, allAnswered]);

  // Progress calculation
  const answeredQuestions = answers.filter(a => a !== null).length;
  const progress = (answeredQuestions / questions.length) * 100;



  console.log('🔄 Render check:', { isActive, startTime, showProgressPopup, showCongratulationsPopup });
  
  if (!isActive && startTime === null) {
    return (
      <>
        {/* Test Progress Popup - shows on start screen */}
        <TestProgressPopup 
          isOpen={showProgressPopup}
          questionNumber={savedProgress}
          totalQuestions={questions.length}
          timeRemaining={savedTimeRemaining}
          onContinue={continueTest}
          onRestart={restartTest}
          onViewResult={viewSavedResult}
        />
        
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
          onConfettiTrigger={handleConfettiTrigger}
          preloadedUserInfo={preloadedUserInfo}
          isAuthenticatedUser={isAuthenticatedUser}
        />
        
        <div className="max-w-4xl mx-auto text-center py-20">
          <motion.div
            className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100"
          >
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
          
          <motion.button
            onClick={startTest}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">🚀</span>
            Bắt Đầu Test Ngay
          </motion.button>
          
          <p className="text-sm text-gray-500 mt-4">
            💡 Mẹo: Sử dụng phím số 1-4 để chọn đáp án nhanh chóng
          </p>
        </motion.div>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-20">
      <Confetti trigger={showConfetti} type="light" />
      
      {/* Congratulations Popup */}
      <CongratulationsPopup 
        isOpen={showCongratulationsPopup}
        onComplete={handlePopupComplete}
        onConfettiTrigger={handleConfettiTrigger}
        preloadedUserInfo={preloadedUserInfo}
        isAuthenticatedUser={isAuthenticatedUser}
      />
      
      {/* Time Up Popup */}
      <TimeUpPopup 
        isOpen={showTimeUpPopup}
        onComplete={handlePopupComplete}
        preloadedUserInfo={preloadedUserInfo}
        isAuthenticatedUser={isAuthenticatedUser}
      />
      
      {/* Test Progress Popup */}
      <TestProgressPopup 
        isOpen={showProgressPopup}
        questionNumber={savedProgress}
        totalQuestions={questions.length}
        timeRemaining={savedTimeRemaining}
        onContinue={continueTest}
        onRestart={restartTest}
        onViewResult={viewSavedResult}
      />

      
      {/* Header with timer and progress */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ProgressBar 
              current={answeredQuestions} 
              total={questions.length}
              showSteps={false}
            />
          </div>
          
          <div className="ml-8">
            <Timer 
              initialTime={timeLimit}
              onTimeUp={handleTimeUp}
              isActive={isActive}
              timeElapsed={timeElapsed}
            />
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Đã trả lời: {answeredQuestions}/{questions.length}
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Tiến độ: {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.1 }}
          className="mb-6"
        >
          <QuestionCard
            question={questions[currentQuestion]}
            selectedAnswer={answers[currentQuestion]}
            onAnswerSelect={handleAnswerSelect}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </motion.button>

          <div className="flex items-center space-x-3">
            {/* Question indicators */}
            <div className="flex space-x-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => jumpToQuestion(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                    index === currentQuestion
                      ? 'bg-primary-600 text-white'
                      : answers[index] !== null
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Complete Button - Shows when all answered */}
          {allAnswered ? (
            <motion.button
              onClick={submitTest}
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
              }`}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="mr-2">🏁</span>
                  Hoàn thành
                </>
              )}
            </motion.button>
          ) : (
            <div className="w-32 text-center">
              <p className="text-xs text-orange-600 font-medium">
                Còn {questions.length - answeredQuestions} câu
              </p>
            </div>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 Phím tắt: 1-4 (chọn đáp án) • ← → (điều hướng) • Enter (hoàn thành khi đủ câu)
        </div>
      </div>

      {/* Submit button center - Shows when all answered */}
      {allAnswered && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center mt-6">
          <motion.button
            onClick={submitTest}
            disabled={isSubmitting}
            className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
              isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
            }`}
            whileHover={!isSubmitting ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <span className="mr-2">🏁</span>
                Hoàn thành Test
              </>
            )}
          </motion.button>
          
          <p className="text-sm text-gray-500 mt-3">
            🎉 Tất cả câu hỏi đã được trả lời! Nhấn để xem kết quả.
          </p>
        </div>
      )}
    </div>
  );
}