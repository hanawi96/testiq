import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { ResultData, UserInfo } from './types';
import type { IQLevel } from '../iq/types';

interface ResultHeroProps {
  score: number;
  percentile: number;
  iqLevel: IQLevel;
  userInfo: {name: string, age: string, location: string};
  onRetake: () => void;
}

const ResultHero: React.FC<ResultHeroProps> = ({ 
  score, 
  percentile, 
  iqLevel, 
  userInfo, 
  onRetake 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedThumbPosition, setAnimatedThumbPosition] = useState(0);
  
  // Calculate target thumb position (0-100%)
  const targetThumbPosition = Math.min(Math.max(((score - 70) / 80) * 100, 0), 100);
  
  // Trigger score animation on mount
  useEffect(() => {
    // Animate score counting and thumb position from 0 to actual score
    const duration = 2000; // 2 seconds
    const steps = 60; // 60 FPS
    const scoreIncrement = score / steps;
    const thumbIncrement = targetThumbPosition / steps;
    
    let currentStep = 0;

    const animationTimer = setInterval(() => {
      currentStep++;
      
      // Animate score
      const newScore = Math.min(Math.round(scoreIncrement * currentStep), score);
      setAnimatedScore(newScore);
      
      // Animate thumb position  
      const newThumbPosition = Math.min(thumbIncrement * currentStep, targetThumbPosition);
      setAnimatedThumbPosition(newThumbPosition);

      if (currentStep >= steps || (newScore >= score && newThumbPosition >= targetThumbPosition)) {
        setAnimatedScore(score);
        setAnimatedThumbPosition(targetThumbPosition);
        clearInterval(animationTimer);
      }
    }, duration / steps);

    return () => {
      clearInterval(animationTimer);
    };
  }, [score, targetThumbPosition]);
  
  // Isolated animated components to prevent re-render of static content
  const AnimatedScore = ({ score }: { score: number }) => (
    <div className="text-7xl font-bold text-gray-900 mb-4">
      {score}
    </div>
  );

  const AnimatedThumb = ({ position }: { position: number }) => (
    <div 
      className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-lg transform -translate-y-0.5 -translate-x-2"
      style={{ left: `${position}%` }}
    />
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 text-center relative overflow-hidden shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-600/20 dark:to-purple-600/20"></div>
      <div className="relative z-10">
        {/* Personalized greeting với dark mode */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
            🎉 Chúc mừng {userInfo.name}!
          </h1>
          {(userInfo.age || userInfo.location) && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userInfo.age && `${userInfo.age} tuổi`}{userInfo.age && userInfo.location && ' • '}{userInfo.location}
            </p>
          )}
        </div>

        <AnimatedScore score={animatedScore} />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Chỉ số IQ của bạn</h2>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${iqLevel.color}-100 dark:bg-${iqLevel.color}-900/30 text-${iqLevel.color}-700 dark:text-${iqLevel.color}-300`}>
            {iqLevel.icon} {iqLevel.level}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Bạn thông minh hơn <span className="font-bold text-blue-600 dark:text-blue-400">{percentile}%</span> dân số thế giới
        </p>

        {/* IQ Scale với dark mode */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative h-3 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-blue-400 rounded-full">
            <AnimatedThumb position={animatedThumbPosition} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>70</span>
            <span>100</span>
            <span>130</span>
            <span>150+</span>
          </div>
        </div>
        
        {/* Action Buttons với dark mode */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={onRetake}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Test lại</span>
          </button>

          <button
            onClick={() => window.location.href = '/leaderboard'}
            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Bảng xếp hạng</span>
          </button>

          <button
            onClick={() => {
              const shareData = {
                title: `Tôi đạt ${score} điểm IQ!`,
                text: `Vừa hoàn thành bài IQ Test và đạt ${score} điểm, vượt ${percentile}% dân số! 🧠`,
                url: window.location.href
              };

              if (navigator.share) {
                navigator.share(shareData);
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Đã copy link kết quả!');
              }
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultHero; 