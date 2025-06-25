import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ResultData {
  score: number;
  rawScore: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  percentile: number;
  classification: {
    level: string;
    color: string;
    description: string;
  };
  timeTaken: number;
  timeLimit: number;
  answerDetails: any[];
  completionRate: number;
}

interface ResultComponentProps {
  results: ResultData;
  onRetake: () => void;
  onHome: () => void;
}

export default function ResultComponent({ results, onRetake, onHome }: ResultComponentProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Trigger confetti for good scores
    if (results.score >= 115) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Animate score counting
    const duration = 2000;
    const steps = 60;
    const increment = results.score / steps;
    let currentScore = 0;
    
    const timer = setInterval(() => {
      currentScore += increment;
      if (currentScore >= results.score) {
        setAnimatedScore(results.score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(currentScore));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [results.score]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 130) return 'text-purple-600';
    if (score >= 115) return 'text-blue-600';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 130) return '🏆';
    if (score >= 115) return '🎖️';
    if (score >= 85) return '✨';
    if (score >= 70) return '👍';
    return '💪';
  };

  const shareResults = (platform: string) => {
    const text = `Tôi vừa đạt ${results.score} điểm IQ! Bạn thử test xem sao nhé: ${window.location.origin}`;
    const url = encodeURIComponent(window.location.origin);
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(text);
        alert('Đã sao chép link chia sẻ!');
        break;
    }
  };

  const analyzeStrengths = () => {
    const typePerformance: Record<string, { correct: number; total: number }> = {};
    
    results.answerDetails.forEach(detail => {
      if (!typePerformance[detail.type]) {
        typePerformance[detail.type] = { correct: 0, total: 0 };
      }
      typePerformance[detail.type].total++;
      if (detail.isCorrect) {
        typePerformance[detail.type].correct++;
      }
    });

    const strengths = [];
    const improvements = [];

    Object.entries(typePerformance).forEach(([type, performance]) => {
      const percentage = (performance.correct / performance.total) * 100;
      const typeName = getTypeName(type);
      
      if (percentage >= 70) {
        strengths.push(typeName);
      } else if (percentage < 50) {
        improvements.push(typeName);
      }
    });

    return { strengths, improvements };
  };

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'logical_sequence': 'Chuỗi Logic',
      'logical_reasoning': 'Suy Luận Logic',
      'pattern_recognition': 'Nhận Dạng Mẫu',
      'mathematical_reasoning': 'Suy Luận Toán Học',
      'spatial_reasoning': 'Tư Duy Không Gian',
      'analogy': 'Tương Tự'
    };
    return typeMap[type] || type;
  };

  const { strengths, improvements } = analyzeStrengths();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Results Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-8 py-12 text-white text-center">
            <div className="text-6xl mb-4">{getScoreIcon(results.score)}</div>
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
              Chúc mừng! Bạn đã hoàn thành test IQ
            </h1>
            <p className="text-xl opacity-90">
              Dưới đây là kết quả chi tiết của bạn
            </p>
          </div>

          {/* Score Display */}
          <div className="px-8 py-12 text-center">
            <div className="mb-8">
              <div className="text-6xl md:text-8xl font-bold font-display mb-4">
                <span className={getScoreColor(results.score)}>
                  {animatedScore}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Điểm IQ của bạn
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Cao hơn {results.percentile}% dân số
              </p>
              <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                results.classification.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                results.classification.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                results.classification.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                results.classification.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {results.classification.level} - {results.classification.description}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Câu đúng</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatTime(results.timeTaken)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Thời gian</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {Math.round((results.correctAnswers / results.totalQuestions) * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Độ chính xác</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {results.rawScore}/{results.maxScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Điểm thô</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phân tích chi tiết
            </h3>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Strengths */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-green-500 mr-2">💪</span>
                  Điểm mạnh
                </h4>
                {strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    Hãy tiếp tục luyện tập để phát triển điểm mạnh
                  </p>
                )}
              </div>

              {/* Areas for Improvement */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-orange-500 mr-2">🎯</span>
                  Cần cải thiện
                </h4>
                {improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {improvements.map((improvement, index) => (
                      <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    Bạn đã thể hiện tốt ở tất cả các lĩnh vực!
                  </p>
                )}
              </div>
            </div>

            {/* Toggle Detailed Results */}
            <div className="mt-8">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                <span>Xem chi tiết từng câu hỏi</span>
                <svg 
                  className={`w-5 h-5 ml-2 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDetails && (
                <div className="mt-6 space-y-4">
                  {results.answerDetails.map((detail, index) => (
                    <div 
                      key={detail.questionId}
                      className={`p-4 rounded-xl border ${
                        detail.isCorrect 
                          ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                          : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          Câu {index + 1}: {getTypeName(detail.type)}
                        </h5>
                        <div className={`flex items-center ${
                          detail.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {detail.isCorrect ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="ml-1 font-medium">
                            {detail.points}/{detail.maxPoints} điểm
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {detail.question}
                      </p>
                      <div className="text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Đáp án đúng: </span>
                        <span className="font-medium text-green-600">{detail.correctAnswer.toUpperCase()}</span>
                        {detail.userAnswer && (
                          <>
                            <span className="text-gray-700 dark:text-gray-300 ml-4">Bạn chọn: </span>
                            <span className={`font-medium ${
                              detail.isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {detail.userAnswer.toUpperCase()}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                        {detail.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Results */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chia sẻ kết quả
            </h3>
          </div>

          <div className="p-8">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Chia sẻ kết quả test IQ của bạn với bạn bè và gia đình!
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => shareResults('facebook')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              
              <button
                onClick={() => shareResults('twitter')}
                className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
              
              <button
                onClick={() => shareResults('linkedin')}
                className="flex items-center px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>
              
              <button
                onClick={() => shareResults('copy')}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Sao chép link
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetake}
            className="flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm lại test
          </button>
          
          <button
            onClick={onHome}
            className="flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}