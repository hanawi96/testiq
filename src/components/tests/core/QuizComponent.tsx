import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizData {
  meta: {
    title: string;
    description: string;
    timeLimit: number;
    totalQuestions: number;
  };
  questions: Array<{
    id: number;
    type: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
    points: number;
    difficulty: string;
  }>;
}

interface QuizComponentProps {
  quizData: QuizData;
  onComplete: (results: any) => void;
}

export default function QuizComponent({ quizData, onComplete }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeStarted] = useState(Date.now());
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  // ✅ ĐƠN GIẢN TUYỆT ĐỐI: Tạo âm thanh bằng Web Audio API + user interaction
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const initAudio = () => {
    console.log('🎵 initAudio called, current audioContext:', audioContext);
    if (!audioContext) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🎵 Audio context created:', ctx.state);
        setAudioContext(ctx);
      } catch (error) {
        console.error('❌ Failed to create audio context:', error);
      }
    }
  };

  const playSound = (type: 'correct' | 'wrong' | 'warning' | 'complete') => {
    console.log(`🔊 playSound called with type: ${type}`);
    console.log(`🔊 audioContext state:`, audioContext?.state);
    
    if (!audioContext) {
      console.log('❌ No audio context available, trying to init...');
      initAudio();
      return;
    }

    try {
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended audio context...');
        audioContext.resume();
      }

      // Tạo âm thanh đơn giản với frequency khác nhau
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Cấu hình âm thanh cho từng loại
      const configs = {
        correct: { frequency: 800, duration: 0.15, type: 'sine' as OscillatorType },
        wrong: { frequency: 300, duration: 0.3, type: 'square' as OscillatorType },
        warning: { frequency: 600, duration: 0.1, type: 'triangle' as OscillatorType },
        complete: { frequency: 1000, duration: 0.4, type: 'sine' as OscillatorType }
      };
      
      const config = configs[type];
      console.log(`🔊 Playing ${type} sound:`, config);
      
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      oscillator.type = config.type;
      
      // Volume control
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Tăng volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
      
      console.log('✅ Sound should be playing now');
      
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      console.log(`🔊 Visual fallback: ${type === 'correct' ? '✅' : type === 'wrong' ? '❌' : '🔔'}`);
    }
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    console.log(`🎯 handleAnswer called: questionId=${questionId}, answerIndex=${answerIndex}`);
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    
    // ✅ SMART: Instant feedback with sound
    const question = quizData.questions.find(q => q.id === questionId);
    console.log(`🎯 Found question:`, question);
    
    if (question) {
      const isCorrect = answerIndex === question.correct;
      console.log(`🎯 Answer is ${isCorrect ? 'CORRECT' : 'WRONG'}`);
      
      playSound(isCorrect ? 'correct' : 'wrong');
      
      // ✅ SIMPLE: Haptic feedback for mobile
      if (navigator.vibrate) {
        console.log(`📱 Vibrating: ${isCorrect ? 50 : 100}ms`);
        navigator.vibrate(isCorrect ? 50 : 100);
      }
      
      // Tự động chuyển sang câu hỏi tiếp theo sau 600ms (đủ thời gian để người dùng thấy hiệu ứng)
      if (currentQuestion < quizData.questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
        }, 600);
      }
    } else {
      console.error('❌ Question not found!');
    }
  };

  const handleTimeWarning = () => {
    setShowTimeWarning(true);
    playSound('warning');
  };

  const handleTimeUp = () => {
    playSound('complete');
    calculateResults();
  };

  const calculateResults = () => {
    const timeTaken = Math.round((Date.now() - timeStarted) / 1000);
    let correctAnswers = 0;
    let totalPoints = 0;
    let maxPoints = 0;
    const answerDetails: any[] = [];

    quizData.questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct;
      
      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points;
      }
      
      maxPoints += question.points;
      
      answerDetails.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correct,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points,
        difficulty: question.difficulty,
        type: question.type
      });
    });

    // Calculate IQ score (simplified formula)
    const rawScore = (totalPoints / maxPoints) * 100;
    let iqScore = Math.round(85 + (rawScore / 100) * 45); // Range 85-130+
    
    // Adjust based on time taken (bonus for speed)
    const timeBonus = Math.max(0, (quizData.meta.timeLimit - timeTaken) / quizData.meta.timeLimit * 10);
    iqScore = Math.min(200, Math.round(iqScore + timeBonus));

    // Determine classification
    const getClassification = (score: number) => {
      if (score >= 160) return { level: 'Thiên tài', color: 'purple', description: 'Chỉ số IQ vượt trội' };
      if (score >= 130) return { level: 'Rất cao', color: 'blue', description: 'Trí thông minh vượt trội' };
      if (score >= 115) return { level: 'Cao', color: 'green', description: 'Trên mức trung bình' };
      if (score >= 85) return { level: 'Trung bình', color: 'yellow', description: 'Mức trung bình' };
      if (score >= 70) return { level: 'Dưới trung bình', color: 'orange', description: 'Dưới mức trung bình' };
      return { level: 'Thấp', color: 'red', description: 'Cần cải thiện' };
    };

    const classification = getClassification(iqScore);
    
    // Calculate percentile (approximation)
    const percentile = Math.min(99, Math.round((iqScore - 70) / 60 * 90));

    const results = {
      score: iqScore,
      rawScore: totalPoints,
      maxScore: maxPoints,
      correctAnswers,
      totalQuestions: quizData.questions.length,
      percentile,
      classification,
      timeTaken,
      timeLimit: quizData.meta.timeLimit,
      answerDetails,
      completionRate: Math.round((Object.keys(answers).length / quizData.questions.length) * 100)
    };

    // Trigger confetti for good scores
    if (iqScore >= 115) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      playSound('complete');
    }

    onComplete(results);
  };

  const currentQ = quizData.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Progress Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Test IQ - Câu hỏi {currentQuestion + 1} / {quizData.questions.length}
              </h1>
              <p className="text-gray-600">
                Đã trả lời: {answeredCount} / {quizData.questions.length} câu
              </p>
            </div>

            {/* Timer */}
            <div className="lg:w-80">
              <Timer
                initialTime={quizData.meta.timeLimit}
                onTimeUp={handleTimeUp}
                isActive={true}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <ProgressBar 
              current={answeredCount} 
              total={quizData.questions.length}
            />
          </div>
        </div>

        {/* Time Warning */}
        {showTimeWarning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-yellow-800 font-medium">Chỉ còn 5 phút! Hãy tập trung hoàn thành bài test.</span>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="mb-8" onClick={initAudio}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
          <QuestionCard
            question={{
              id: currentQ.id,
              type: currentQ.type as any,
              difficulty: currentQ.difficulty as any,
              question: currentQ.question,
              options: currentQ.options,
              correct: currentQ.correct,
              explanation: currentQ.explanation
            }}
            selectedAnswer={answers[currentQ.id] || null}
            onAnswerSelect={(answerId) => handleAnswer(currentQ.id, answerId)}
          />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <motion.span 
              whileHover={{ x: -3 }} 
              transition={{ duration: 0.2 }}
          >
            ← Quay lại
            </motion.span>
          </button>

          <div className="flex items-center space-x-2">
            {quizData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[quizData.questions[index].id] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === quizData.questions.length - 1 ? (
            <button
              onClick={calculateResults}
              disabled={Object.keys(answers).length !== quizData.questions.length}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                Object.keys(answers).length !== quizData.questions.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
              }`}
            >
            Hoàn thành
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(quizData.questions.length - 1, currentQuestion + 1))}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
            >
              <motion.span 
                whileHover={{ x: 3 }} 
                transition={{ duration: 0.2 }}
            >
              Tiếp theo →
              </motion.span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}