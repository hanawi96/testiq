import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';

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

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleTimeWarning = () => {
    setShowTimeWarning(true);
  };

  const handleTimeUp = () => {
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
        <div className="mb-8">
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
            ← Quay lại
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
              Tiếp theo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}