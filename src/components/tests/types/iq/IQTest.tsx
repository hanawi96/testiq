import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timer from '../../core/Timer';
import ProgressBar from '../../core/ProgressBar';
import QuestionCard from '../../core/QuestionCard';
import Confetti, { useConfetti } from '../../../common/effects/Confetti';
import CongratulationsPopup, { type UserInfo } from '../../../common/popups/CongratulationsPopup';
import TimeUpPopup from '../../../common/popups/TimeUpPopup';
import TestProgressPopup from '../../../common/popups/TestProgressPopup';
import CompletedTestPopup from '../../../common/popups/CompletedTestPopup';

import type { Question, TestResult } from '../../../../utils/test';
import { generateTestResult, saveTestResult } from '../../../../utils/test';
import { saveTestState, loadTestState, clearTestState, hasInProgressTest, isTestCompleted, calculateRemainingTime } from '../../../../utils/test-state';

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isActive, setIsActive] = useState(startImmediately);
  const [startTime, setStartTime] = useState<number | null>(startImmediately ? Date.now() : null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAnswered, setJustAnswered] = useState(false);
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [showCompletedTestPopup, setShowCompletedTestPopup] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false); // ✅ Track khi test đã hết thời gian
  const [savedProgress, setSavedProgress] = useState(0);
  const [savedTimeRemaining, setSavedTimeRemaining] = useState(0);
  const [preloadedUserInfo, setPreloadedUserInfo] = useState<UserInfo | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // ✅ SMART: Arrow key navigation for answer selection
  const [highlightedAnswer, setHighlightedAnswer] = useState<number | null>(null);
  
  const { fireSingle } = useConfetti();
  
  // Bắt đầu test ngay lập tức nếu startImmediately=true
  useEffect(() => {
    if (startImmediately) {
      console.log('🚀 Starting test immediately because startImmediately=true');
      if (hasInProgressTest()) {
        // Nếu có test đang làm dở
        const savedState = loadTestState();
        if (savedState) {
          if (isTestCompleted()) {
            console.log('🎉 Test completed but not submitted - showing completed test popup');
            setShowCompletedTestPopup(true);
          } else {
            console.log('📝 Found in-progress test - loading saved state');
            setCurrentQuestion(savedState.currentQuestion);
            setAnswers(savedState.answers);
            setTimeElapsed(savedState.timeElapsed);
            setStartTime(Date.now() - (savedState.timeElapsed * 1000));
          }
        }
      }
    }
  }, [startImmediately]);

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
        const { getCurrentUserInfo } = await import('../../../../utils/test');
        const { AuthService } = await import('../../../../../backend');
        
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
    setIsTimeUp(false); // ✅ Reset time up state
    setIsReviewMode(false); // ✅ CRITICAL: Reset review mode
    
    // ✅ Reset navigation state
    setHighlightedAnswer(null);
  }, [questions.length]);

  // Don't check on mount, only when user clicks start button

  // ✅ Update timeElapsed every second for precise timing sync
  useEffect(() => {
    if (!isActive || !startTime) return;

    const updateInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
    }, 1000); // Update every second for sync

    return () => clearInterval(updateInterval);
  }, [isActive, startTime]);

  // Save state periodically when test is active
  useEffect(() => {
    if (!isActive || !startTime) return;

    const saveInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
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
    if (audioContext) {
      try {
        audioContext.close();
        setAudioContext(null);
      } catch (error) {
        console.warn('⚠️ Error stopping audio:', error);
      }
    }
    
    // ✅ STEP 2: Clear states and storage - KHÔNG DÙNG BATCH
    clearTestState(); // Clear any saved progress
    
    // ✅ STEP 3: Tạm dừng tất cả các hiệu ứng
    setIsActive(false);
    
    // ✅ STEP 4: Sử dụng requestAnimationFrame để đảm bảo tất cả thay đổi đã được áp dụng
    requestAnimationFrame(() => {
      // Sau đó đặt các giá trị khác về ban đầu
      setTimeElapsed(0);
      setCurrentQuestion(0);
      setAnswers(new Array(questions.length).fill(null));
      
      // Gọi setTimeout để đảm bảo React đã render với state mới
      setTimeout(() => {
        // Bật lại hoạt động và tạo thời gian bắt đầu mới
        setShowTimeUpPopup(false);
        setIsTimeUp(false);
        setShowCompletedTestPopup(false);
        setShowCongratulationsPopup(false);
        setShowProgressPopup(false);
        setIsReviewMode(false);
        setIsSubmitting(false);
        setJustAnswered(false);
        setHighlightedAnswer(null);
        setConfettiTriggered(false);
        setShowConfetti(false);
        
        // Gọi thêm một requestAnimationFrame để đảm bảo tất cả state đã được áp dụng
        requestAnimationFrame(() => {
          setStartTime(Date.now());
          setIsActive(true);
          
          // Sau khi tất cả đã render xong, bật lại animation
          setTimeout(() => {
            document.body.classList.remove('disable-animations');
          }, 100);
        });
      }, 50);
    });
    
  }, [questions.length]);

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
    // ✅ OPTIMIZED: Use centralized restart logic - tái sử dụng code
    restartFreshTest();
  }, [restartFreshTest]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    // ✅ CRITICAL: Prevent answer selection if time is up
    if (isTimeUp) {
      console.log('⏰ Cannot select answer - time is up!');
      return;
    }
    
    console.log(`🎯 handleAnswerSelect called: questionIndex=${currentQuestion}, answerIndex=${answerIndex}`);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    setJustAnswered(true);
    
    // ✅ SMART: Instant feedback
    const question = questions[currentQuestion];
    if (question) {
      const isCorrect = answerIndex === question.correct;
      console.log(`🎯 Answer is ${isCorrect ? 'CORRECT' : 'WRONG'}`);
      
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
  }, [answers, currentQuestion, isActive, startTime, timeLimit, questions, playSound, isTimeUp]);

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

  // ✅ SMART: Alarm bell sound for time up
  const playAlarmBell = useCallback(() => {
    console.log('🔔 playAlarmBell called - audioContext:', audioContext);
    
    // ✅ SMART: Create audio context on-demand like playSound does
    let ctx = audioContext;
    if (!ctx) {
      console.log('🔔 Creating audio context on-demand for alarm...');
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx); // Update state for future calls
        console.log('🔔 Audio context created for alarm:', ctx.state);
      } catch (error) {
        console.error('❌ Failed to create audio context for alarm:', error);
        return;
      }
    }

    try {
      // Resume context if suspended
      if (ctx.state === 'suspended') {
        console.log('🔔 Resuming suspended audio context for alarm...');
        ctx.resume();
      }

      console.log('🔔 Starting to play alarm bell sounds');
      // Create a more prominent alarm bell sound
      const bellFrequencies = [800, 1000, 800, 1000, 800]; // Alternating bell tones
      let delay = 0;
      
      bellFrequencies.forEach((frequency, index) => {
        setTimeout(() => {
          console.log(`🔔 Playing bell ${index + 1}/5 at ${frequency}Hz`);
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.type = 'triangle'; // Bell-like sound
          
          // Bell envelope: sharp attack, quick decay
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
        }, delay);
        
        delay += 200; // 200ms between each bell sound
      });
      
      console.log('🔔 Alarm bell sequence initiated');
    } catch (error) {
      console.error('❌ Error playing alarm bell:', error);
    }
  }, [audioContext]);

  // Handle time up - shows time up popup
  const handleTimeUp = useCallback(() => {
    console.log('🔔 IQTest: handleTimeUp called');
    setIsActive(false);
    setIsTimeUp(true); // ✅ Mark test as timed out - no more interactions allowed
    
    // ✅ Play alarm bell sound for time up
    console.log('🔔 IQTest: About to play alarm bell');
    playAlarmBell();
    
    clearTestState(); // Clear saved state when time is up
    setShowTimeUpPopup(true);
    console.log('🔔 IQTest: Time up popup shown');
  }, [playAlarmBell]);

  // Smart auto-advance logic + Auto show review popup when all answered
  useEffect(() => {
    if (justAnswered && answers[currentQuestion] !== null) {
      const timer = setTimeout(() => {
        if (isReviewMode) {
          // In review mode: simply go to next question (regardless of answered status)
          const nextQuestion = currentQuestion + 1;
          if (nextQuestion < questions.length) {
            setCurrentQuestion(nextQuestion);
          }
          setJustAnswered(false);
        } else {
          // Normal mode: find next unanswered question
          const nextUnanswered = findNextUnanswered(currentQuestion + 1);
          console.log('auto-advance: currentQuestion =', currentQuestion, ', nextUnanswered =', nextUnanswered, ', answers =', answers.map((a, i) => `${i}:${a}`));
          if (nextUnanswered !== -1) {
            setCurrentQuestion(nextUnanswered);
            setJustAnswered(false);
          } else {
            // All questions answered - auto submit
            setJustAnswered(false);
            submitTest();
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
      }, [justAnswered, answers, currentQuestion, findNextUnanswered, submitTest, isReviewMode]);

  // ✅ SMART: Enhanced keyboard navigation with arrow key answer selection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isActive || showCongratulationsPopup || showTimeUpPopup || isTimeUp) return;
      
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
  }, [isActive, currentQuestion, answers, handleAnswerSelect, nextQuestion, previousQuestion, submitTest, questions, showCongratulationsPopup, showTimeUpPopup, allAnswered, highlightedAnswer, isTimeUp]);

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
          onReview={() => {
            setShowCongratulationsPopup(false);
            // ✅ FIX: Load saved state and enter review mode
            const savedState = loadTestState();
            if (savedState) {
              setCurrentQuestion(savedState.currentQuestion);
              setAnswers(savedState.answers);
              setTimeElapsed(savedState.timeElapsed);
              setIsReviewMode(true);
              
              // ✅ FIX: Check if there's still time left before resuming timer
              const remainingTime = timeLimit - savedState.timeElapsed;
              if (remainingTime > 0) {
                // ✅ CRITICAL: Set startTime để timer đếm từ thời điểm hiện tại
                setStartTime(Date.now() - (savedState.timeElapsed * 1000));
                setIsActive(true); // Resume timer only if time left
                console.log('⏰ Timer resumed - remaining time:', remainingTime, 'seconds, adjusted startTime');
              } else {
                setIsTimeUp(true); // Mark as time up if no time left
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
            Bắt Đầu Test Ngay
          </motion.button>
          
          <p className="text-sm text-gray-500 mt-4">
            Mẹo: Sử dụng phím số 1-4 để chọn đáp án nhanh chóng
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
        onClose={() => {
          setShowCongratulationsPopup(false);
          setIsReviewMode(true); // Enable review mode but stay at current question
        }}
        onReview={() => {
          setShowCongratulationsPopup(false);
          setIsReviewMode(true); // Enable review mode and jump to question 1
          setCurrentQuestion(0);
          // ✅ FIX: Keep timer running if there's still time left
          if (!isTimeUp && startTime) {
            // ✅ CRITICAL: Adjust startTime để timer đếm đúng từ thời điểm hiện tại
            const currentElapsed = timeElapsed;
            setStartTime(Date.now() - (currentElapsed * 1000));
            setIsActive(true); // Resume timer
            console.log('⏰ Timer resumed - adjusted startTime for review mode, elapsed:', currentElapsed);
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
          // ✅ OPTIMIZED: Use centralized restart logic - siêu nhanh, siêu mượt
          restartFreshTest();
        }}
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
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 relative overflow-hidden">


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
              key={`timer-${startTime}`}
              initialTime={timeLimit}
              onTimeUp={handleTimeUp}
              isActive={isActive}
              timeElapsed={timeElapsed}
            />
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
          {questions[currentQuestion] && (
            <QuestionCard
              question={questions[currentQuestion]}
              selectedAnswer={answers[currentQuestion]}
              onAnswerSelect={handleAnswerSelect}
              highlightedAnswer={highlightedAnswer}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          {/* Professional Previous Button */}
          <motion.button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className={`group flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 ${
              currentQuestion === 0
                ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100'
            }`}
            whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
            title={currentQuestion > 0 ? "Câu hỏi trước" : "Đã ở câu đầu tiên"}
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          {/* Centered Smart Question Navigator */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-2">
              {/* Show range navigation for 60+ questions */}
              {questions.length > 10 ? (
                <div className="flex items-center space-x-1">
                  {/* Previous range button */}
                  {currentQuestion >= 5 && (
                    <button
                      onClick={() => jumpToQuestion(Math.max(0, currentQuestion - 5))}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
                      title="Nhảy về 5 câu trước"
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
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200'
                            : answers[index] !== null
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={`Câu ${index + 1}${answers[index] !== null ? ' (đã trả lời)' : ''}`}
                      >
                        {index + 1}
                      </button>
                    ));
                  })()}
                  
                  {/* Progress indicator */}
                  <div className="mx-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium border">
                    {currentQuestion + 1}/{questions.length}
                  </div>
                  
                  {/* Next range button */}
                  {currentQuestion < questions.length - 6 && (
                    <button
                      onClick={() => jumpToQuestion(Math.min(questions.length - 1, currentQuestion + 5))}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
                      title="Nhảy tới 5 câu sau"
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
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200'
                          : answers[index] !== null
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={`Câu ${index + 1}${answers[index] !== null ? ' (đã trả lời)' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Show Complete button in review mode when all answered */}
          {isReviewMode && allAnswered ? (
            <motion.button
              onClick={submitTest}
              disabled={isSubmitting}
              className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700 border border-green-600 hover:border-green-700 shadow-sm hover:shadow-md'
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
                  Xem kết quả
                </>
              )}
            </motion.button>
          ) : (
            <div className="invisible w-[120px]"></div>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Phím tắt: 1-4 hoặc ↑ ↓ ← → (chọn đáp án) • Enter (xác nhận)
        </div>
      </div>


    </div>
  );
}