import React, { useState, useEffect } from 'react';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import confetti from 'canvas-confetti';

interface Question {
  id: number;
  type: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correct: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface QuizData {
  meta: {
    title: string;
    description: string;
    timeLimit: number;
    totalQuestions: number;
    difficulty: string;
  };
  questions: Question[];
}

interface QuizComponentProps {
  quizData: QuizData;
  onComplete: (results: any) => void;
}

export default function QuizComponent({ quizData, onComplete }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeStarted] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (isFinishing) return;
    
    const confirmFinish = window.confirm("Bạn có chắc muốn hoàn thành test không?");
    if (!confirmFinish) return;

    setIsFinishing(true);
    calculateResults();
  };

  const handleTimeUp = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    alert("Hết thời gian!");
    calculateResults();
  };

  const handleTimeWarning = (timeLeft: number) => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
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
    }

    onComplete(results);
  };

  const currentQ = quizData.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (currentQuestion + 1) / quizData.questions.length * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Progress Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 dark:text-white mb-2">
                Test IQ - Câu hỏi {currentQuestion + 1} / {quizData.questions.length}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Đã trả lời: {answeredCount} / {quizData.questions.length} câu
              </p>
            </div>

            {/* Timer */}
            <div className="lg:w-80">
              <Timer
                initialTime={quizData.meta.timeLimit}
                onTimeUp={handleTimeUp}
                onWarning={handleTimeWarning}
                warningTime={300}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <ProgressBar 
              current={currentQuestion + 1} 
              total={quizData.questions.length}
              answeredCount={answeredCount}
            />
          </div>
        </div>

        {/* Time Warning */}
        {showWarning && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                Còn 5 phút! Hãy kiểm tra lại các câu trả lời của bạn.
              </span>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="mb-8">
          <QuestionCard
            question={currentQ}
            selectedAnswer={answers[currentQ.id]}
            onAnswerSelect={(answerId) => handleAnswer(currentQ.id, answerId)}
            questionNumber={currentQuestion + 1}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Câu trước
          </button>

          <div className="flex items-center space-x-4">
            {/* Question Navigation Dots */}
            <div className="hidden md:flex items-center space-x-2">
              {quizData.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    index === currentQuestion
                      ? 'bg-blue-500 text-white'
                      : answers[quizData.questions[index].id]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion === quizData.questions.length - 1 ? (
              <button
                onClick={handleFinish}
                disabled={isFinishing}
                className="flex items-center px-6 py-3 text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isFinishing ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Hoàn thành
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Câu tiếp theo
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}