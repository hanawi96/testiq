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
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // ✅ GAMIFICATION: XP & Combo System
  const [totalXP, setTotalXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [recentXPGain, setRecentXPGain] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  
  // ✅ SMART: Arrow key navigation for answer selection
  const [highlightedAnswer, setHighlightedAnswer] = useState<number | null>(null);
  
    const { fireSingle } = useConfetti();

  // ✅ SMART: Calculate XP based on difficulty + streak multiplier
  const calculateXP = useCallback((questionIndex: number, isCorrect: boolean) => {
    if (!isCorrect) return 0;
    
    const question = questions[questionIndex];
    const baseXP = {
      'easy': 10,
      'medium': 20, 
      'hard': 40,
      'expert': 80
    }[question.difficulty] || 10;
    
    // Streak multiplier: 1x, 1.5x, 2x, 2.5x, 3x (max)
    const streakMultiplier = Math.min(1 + (currentStreak * 0.5), 3);
    
    return Math.round(baseXP * streakMultiplier);
  }, [questions, currentStreak]);

  // ✅ SMART: Handle XP gain with animation
  const gainXP = useCallback((amount: number) => {
    if (amount <= 0) return;
    
    setTotalXP(prev => prev + amount);
    setRecentXPGain(amount);
    setShowXPAnimation(true);
    
    // Hide animation after 2 seconds
    setTimeout(() => {
      setShowXPAnimation(false);
      setRecentXPGain(0);
    }, 2000);
  }, []);



  const playSound = useCallback((type: 'correct' | 'wrong' | 'warning' | 'complete') => {
    console.log(`🔊 playSound called with type: ${type}`);
    
    // ✅ SMART: Create audio context on-demand if not exists
    let ctx = audioContext;
    if (!ctx) {
      console.log('🔊 Creating audio context on-demand...');
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx); // Update state for future calls
        console.log('🎵 Audio context created:', ctx.state);
      } catch (error) {
        console.error('❌ Failed to create audio context:', error);
        return;
      }
    }

    try {
      // Resume context if suspended
      if (ctx.state === 'suspended') {
        console.log('🔊 Resuming suspended audio context...');
        ctx.resume();
      }

      if (type === 'complete') {
        // ✅ SPECIAL: Celebration sound sequence
        playCelebrationSound(ctx);
      } else {
        // Normal single tone sounds
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        const configs = {
          correct: { frequency: 800, duration: 0.15, type: 'sine' as OscillatorType },
          wrong: { frequency: 800, duration: 0.15, type: 'sine' as OscillatorType },
          warning: { frequency: 600, duration: 0.1, type: 'triangle' as OscillatorType },
          complete: { frequency: 1000, duration: 0.4, type: 'sine' as OscillatorType }
        };
        
        const config = configs[type];
        console.log(`🔊 Playing ${type} sound:`, config);
        
        oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
        oscillator.type = config.type;
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + config.duration);
      }
      
      console.log('✅ Sound should be playing now');
      
    } catch (error) {
      console.error('❌ Error playing sound:', error);
    }
  }, [audioContext]);

  // ✅ CELEBRATION: Special multi-tone success sound
  const playCelebrationSound = useCallback((ctx: AudioContext) => {
    console.log('🎉 Playing celebration sound sequence!');
    
    // Victory melody: C-E-G-C (Do-Mi-Sol-Do) in higher octave
    const melody = [
      { freq: 523, duration: 0.2 }, // C5
      { freq: 659, duration: 0.2 }, // E5
      { freq: 784, duration: 0.2 }, // G5
      { freq: 1047, duration: 0.4 } // C6
    ];
    
    let startTime = ctx.currentTime;
    
    melody.forEach((note, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, startTime);
      oscillator.type = 'sine';
      
      // Volume envelope for musical effect
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration);
      
      startTime += note.duration * 0.8; // Slight overlap for smooth transition
    });
  }, []);

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
    
    // ✅ Reset gamification state
    setTotalXP(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setRecentXPGain(0);
    setShowXPAnimation(false);
    
    // ✅ Reset navigation state
    setHighlightedAnswer(null);
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
    console.log(`🎯 handleAnswerSelect called: questionIndex=${currentQuestion}, answerIndex=${answerIndex}`);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    setJustAnswered(true);
    
    // ✅ SMART: Instant feedback + Gamification
    const question = questions[currentQuestion];
    if (question) {
      const isCorrect = answerIndex === question.correct;
      console.log(`🎯 Answer is ${isCorrect ? 'CORRECT' : 'WRONG'}`);
      
      // ✅ GAMIFICATION: Update streak and XP
      if (isCorrect) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setMaxStreak(prev => Math.max(prev, newStreak));
        
        // Calculate and gain XP
        const xpGained = calculateXP(currentQuestion, true);
        gainXP(xpGained);
        
        console.log(`🎮 Streak: ${newStreak}, XP gained: +${xpGained}, Total XP: ${totalXP + xpGained}`);
      } else {
        // Reset streak on wrong answer
        setCurrentStreak(0);
        console.log(`💔 Streak reset`);
      }
      
      playSound(isCorrect ? 'correct' : 'wrong');
      
      // ✅ Haptic feedback for mobile
      if (navigator.vibrate) {
        console.log(`📱 Vibrating: ${isCorrect ? 50 : 100}ms`);
        navigator.vibrate(isCorrect ? 50 : 100);
      }
    } else {
      console.error('❌ Question not found!');
    }
    
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
  }, [answers, currentQuestion, isActive, startTime, timeLimit, questions, playSound, currentStreak, calculateXP, gainXP, totalXP]);

  // Navigate to next question (smart navigation)
  const nextQuestion = useCallback(() => {
    const nextUnanswered = findNextUnanswered(currentQuestion + 1);
    console.log('nextQuestion: currentQuestion =', currentQuestion, ', nextUnanswered =', nextUnanswered);
    if (nextUnanswered !== -1) {
      setCurrentQuestion(nextUnanswered);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Clear highlight
    }
  }, [currentQuestion, findNextUnanswered]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Clear highlight
    }
  }, [currentQuestion]);

  // Jump to specific question
  const jumpToQuestion = useCallback((questionIndex: number) => {
    setCurrentQuestion(questionIndex);
    setJustAnswered(false);
    setHighlightedAnswer(null); // Clear highlight
  }, []);

  // Submit test - shows congratulations popup
  const submitTest = useCallback(async () => {
    if (isSubmitting || !allAnswered) return;
    
    console.log('submitTest: starting submission process');
    setIsSubmitting(true);
    
    // ✅ STOP TIMER IMMEDIATELY when user clicks Complete
    setIsActive(false);
    
    // ✅ Play completion sound
    playSound('complete');
    
    // ✅ SMART: Mark as completed but keep state for "view result" option
    const currentState = loadTestState();
    if (currentState) {
      const completedState = {
        ...currentState,
        isCompleted: true, // Add completion flag
        completedAt: Date.now() // Track when completed
      };
      localStorage.setItem('iq_test_state', JSON.stringify(completedState));
      console.log('💾 Marked test as completed, keeping state for result viewing');
    }
    
    // ✅ INSTANT: Show popup immediately 
    console.log('submitTest: showing congratulations popup');
    setShowCongratulationsPopup(true);
    setIsSubmitting(false);
  }, [isSubmitting, allAnswered, playSound]);

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
    
    // ✅ SMART: Clear saved state only when user actually views result
    clearTestState();
    console.log('🗑️ Cleared test state after user viewed result');
    
    onComplete(resultWithUserInfo);
  }, [answers, questions, startTime, onComplete]);

  // Handle time up - shows time up popup
  const handleTimeUp = useCallback(() => {
    setIsActive(false);
    
    // ✅ Play warning sound for time up
    playSound('warning');
    
    clearTestState(); // Clear saved state when time is up
    setShowTimeUpPopup(true);
  }, [playSound]);

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

  // ✅ SMART: Enhanced keyboard navigation with arrow key answer selection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isActive || showCongratulationsPopup || showTimeUpPopup) return;
      
      const optionsCount = questions[currentQuestion]?.options.length || 0;
      
      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4':
          const answerIndex = parseInt(e.key) - 1;
          if (answerIndex < optionsCount) {
            handleAnswerSelect(answerIndex);
            setHighlightedAnswer(null); // Clear highlight after selection
          }
          break;
          
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setHighlightedAnswer(prev => {
            if (prev === null) return 0;
            return prev > 0 ? prev - 1 : optionsCount - 1; // Wrap to bottom
          });
          break;
          
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setHighlightedAnswer(prev => {
            if (prev === null) return 0;
            return prev < optionsCount - 1 ? prev + 1 : 0; // Wrap to top
          });
          break;
          
        case 'Enter':
          e.preventDefault();
          if (highlightedAnswer !== null) {
            // Select highlighted answer
            handleAnswerSelect(highlightedAnswer);
            setHighlightedAnswer(null);
          } else if (allAnswered) {
            submitTest();
          } else if (answers[currentQuestion] !== null) {
            nextQuestion();
          }
          break;
          
        
          
                  case 'PageUp':
          case 'KeyQ': // Q for previous question
            e.preventDefault();
            previousQuestion();
            setHighlightedAnswer(null);
            break;
            
          case 'PageDown':
          case 'KeyE': // E for next question
            e.preventDefault();
            if (answers[currentQuestion] !== null) {
              nextQuestion();
              setHighlightedAnswer(null);
            }
            break;
            
          case 'Escape':
            e.preventDefault();
            setHighlightedAnswer(null); // Clear highlight on Escape
            break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, currentQuestion, answers, handleAnswerSelect, nextQuestion, previousQuestion, submitTest, questions, showCongratulationsPopup, showTimeUpPopup, allAnswered, highlightedAnswer]);

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
          onClose={() => setShowCongratulationsPopup(false)}
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
        onClose={() => setShowCongratulationsPopup(false)}
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

      
      {/* Header with timer, progress and gamification */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 relative overflow-hidden">
        {/* XP Animation */}
        <AnimatePresence>
          {showXPAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 1.2 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10"
            >
              +{recentXPGain} XP
            </motion.div>
          )}
        </AnimatePresence>

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
        
        {/* Gamification Stats */}
        <div className="flex items-center justify-end mt-4">
          {/* Gamification stats */}
          <div className="flex items-center space-x-4">
            {/* Total XP */}
            <div className="flex items-center bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-2 rounded-lg">
              <span className="text-lg mr-2">⭐</span>
              <div className="text-sm">
                <div className="font-bold text-purple-700">{totalXP} XP</div>
                <div className="text-xs text-purple-600">Tổng điểm</div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="flex items-center bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-lg">
              <span className="text-lg mr-2">🔥</span>
              <div className="text-sm">
                <div className="font-bold text-orange-700">{currentStreak}</div>
                <div className="text-xs text-orange-600">Streak</div>
              </div>
            </div>

            {/* Max Streak */}
            {maxStreak > 0 && (
              <div className="flex items-center bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2 rounded-lg">
                <span className="text-lg mr-2">🏆</span>
                <div className="text-sm">
                  <div className="font-bold text-green-700">{maxStreak}</div>
                  <div className="text-xs text-green-600">Cao nhất</div>
                </div>
              </div>
            )}
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
            highlightedAnswer={highlightedAnswer}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div className="flex items-center space-x-3">
            {/* Smart Question Navigator */}
            <div className="flex items-center space-x-2">
              {/* Show range navigation for 60+ questions */}
              {questions.length > 10 ? (
                <div className="flex items-center space-x-1">
                  {/* Previous range button */}
                  {currentQuestion >= 5 && (
                    <button
                      onClick={() => jumpToQuestion(Math.max(0, currentQuestion - 5))}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
                    >
                      ‹‹
                    </button>
                  )}
                  
                  {/* Dynamic visible range */}
                  {(() => {
                    const total = questions.length;
                    const current = currentQuestion;
                    let start, end;
                    
                    // Smart range calculation
                    if (current <= 2) {
                      start = 0; end = Math.min(5, total);
                    } else if (current >= total - 3) {
                      start = Math.max(0, total - 5); end = total;
                    } else {
                      start = current - 2; end = current + 3;
                    }
                    
                    const visibleQuestions = [];
                    for (let i = start; i < end; i++) {
                      visibleQuestions.push(i);
                    }
                    
                    return visibleQuestions.map(index => (
                      <button
                        key={index}
                        onClick={() => jumpToQuestion(index)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                          index === currentQuestion
                            ? 'bg-primary-600 text-white shadow-md'
                            : answers[index] !== null
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ));
                  })()}
                  
                  {/* Progress indicator */}
                  <div className="mx-2 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
                    {currentQuestion + 1}/{questions.length}
                  </div>
                  
                  {/* Next range button */}
                  {currentQuestion < questions.length - 6 && (
                    <button
                      onClick={() => jumpToQuestion(Math.min(questions.length - 1, currentQuestion + 5))}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
                    >
                      ››
                    </button>
                  )}
                </div>
              ) : (
                /* Original design for <= 10 questions */
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
              )}
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
          💡 Phím tắt: 1-4 hoặc ↑ ↓ ← → (chọn đáp án) • Enter (xác nhận)
        </div>
      </div>


    </div>
  );
}