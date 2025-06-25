import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import Confetti, { useConfetti } from '../common/Confetti';
import type { Question, TestResult } from '../../utils/test';
import { generateTestResult, saveTestResult } from '../../utils/test';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { fireMultipleBursts } = useConfetti();

  // Start the test
  const startTest = useCallback(() => {
    setIsActive(true);
    setStartTime(Date.now());
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  }, [answers, currentQuestion]);

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  }, [currentQuestion, questions.length]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion]);

  // Submit test
  const submitTest = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsActive(false);
    
    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const filledAnswers = answers.map(answer => answer ?? -1);
    
    const result = generateTestResult(questions, filledAnswers, timeSpent);
    
    // Save to local storage
    saveTestResult(result);
    
    // Show celebration effect
    setShowConfetti(true);
    fireMultipleBursts('celebration');
    
    // Navigate to results after animation
    setTimeout(() => {
      onComplete(result);
    }, 2000);
  }, [answers, questions, startTime, onComplete, isSubmitting, fireMultipleBursts]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    submitTest();
  }, [submitTest]);

  // Auto-advance when answer is selected (optional)
  useEffect(() => {
    if (answers[currentQuestion] !== null && currentQuestion < questions.length - 1) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    }
  }, [answers, currentQuestion, nextQuestion, questions.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isActive) return;
      
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
          if (currentQuestion === questions.length - 1 && answers.every(a => a !== null)) {
            submitTest();
          } else if (answers[currentQuestion] !== null) {
            nextQuestion();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, currentQuestion, answers, handleAnswerSelect, nextQuestion, previousQuestion, submitTest, questions]);

  // Progress calculation
  const answeredQuestions = answers.filter(a => a !== null).length;
  const progress = (answeredQuestions / questions.length) * 100;

  if (!isActive && startTime === null) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <motion.div
          className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6">🧠</div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
            Sẵn sàng bắt đầu Test IQ?
          </h2>
          
          <div className="space-y-4 text-left max-w-2xl mx-auto mb-8">
            <h3 className="font-semibold text-lg text-gray-800 text-center mb-4">
              📋 Hướng dẫn làm bài:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center mb-2">
                  <span className="text-blue-600 mr-2">📖</span>
                  <span className="font-medium">Đọc kỹ câu hỏi</span>
                </div>
                <p className="text-sm text-gray-600">Đọc và hiểu rõ từng câu hỏi trước khi trả lời</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center mb-2">
                  <span className="text-green-600 mr-2">🎯</span>
                  <span className="font-medium">Chọn đáp án tốt nhất</span>
                </div>
                <p className="text-sm text-gray-600">Lựa chọn đáp án đúng nhất theo suy nghĩ của bạn</p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-600 mr-2">🚫</span>
                  <span className="font-medium">Không tra cứu</span>
                </div>
                <p className="text-sm text-gray-600">Không sử dụng máy tính hoặc tài liệu tham khảo</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center mb-2">
                  <span className="text-purple-600 mr-2">🔇</span>
                  <span className="font-medium">Môi trường yên tĩnh</span>
                </div>
                <p className="text-sm text-gray-600">Làm bài trong không gian tập trung tốt nhất</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-8 mb-8 text-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{questions.length}</div>
              <div className="text-sm">Câu hỏi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{Math.floor(timeLimit / 60)}</div>
              <div className="text-sm">Phút</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">5</div>
              <div className="text-sm">Lĩnh vực</div>
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-20">
      <Confetti trigger={showConfetti} duration={3000} />
      
      {/* Header with timer and progress */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ProgressBar 
              current={currentQuestion + 1} 
              total={questions.length}
              showSteps={false}
            />
          </div>
          
          <div className="ml-8">
            <Timer 
              initialTime={timeLimit}
              onTimeUp={handleTimeUp}
              isActive={isActive}
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
          transition={{ duration: 0.3 }}
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
                  onClick={() => setCurrentQuestion(index)}
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

          {currentQuestion === questions.length - 1 ? (
            <motion.button
              onClick={submitTest}
              disabled={isSubmitting || answers.some(a => a === null)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isSubmitting || answers.some(a => a === null)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
              }`}
              whileHover={!isSubmitting && answers.every(a => a !== null) ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting && answers.every(a => a !== null) ? { scale: 0.98 } : {}}
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
            <motion.button
              onClick={nextQuestion}
              disabled={answers[currentQuestion] === null}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                answers[currentQuestion] === null
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              whileHover={answers[currentQuestion] !== null ? { scale: 1.02 } : {}}
              whileTap={answers[currentQuestion] !== null ? { scale: 0.98 } : {}}
            >
              Tiếp theo
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 Phím tắt: 1-4 (chọn đáp án) • ← → (điều hướng) • Enter (tiếp theo)
        </div>
      </div>
    </div>
  );
}