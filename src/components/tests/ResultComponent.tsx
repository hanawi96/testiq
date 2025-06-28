import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  answerDetails: Array<{
    questionId: number;
    question: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
    points: number;
    maxPoints: number;
    difficulty: string;
    type: string;
  }>;
  completionRate: number;
}

interface ResultComponentProps {
  results: ResultData;
  onRetake: () => void;
  onHome: () => void;
}

interface SkillScores {
  logic: number;
  visual: number;
  speed: number;
  math: number;
  memory: number;
}

// Badge info based on score
const getBadgeInfo = (score: number) => {
  if (score >= 140) return { 
    type: 'genius', 
    label: 'Thiên tài', 
    color: 'from-purple-500 to-pink-500', 
    icon: '⭐', 
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800'
  };
  if (score >= 130) return { 
    type: 'superior', 
    label: 'Xuất sắc', 
    color: 'from-blue-500 to-cyan-500', 
    icon: '🏆', 
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  };
  if (score >= 115) return { 
    type: 'above', 
    label: 'Trên trung bình', 
    color: 'from-green-500 to-emerald-500', 
    icon: '⚡', 
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  };
  return { 
    type: 'average', 
    label: 'Trung bình', 
    color: 'from-orange-500 to-red-500', 
    icon: '✓', 
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  };
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ShareButton: React.FC<{ onShare: () => void; icon: string; label: string; color: string }> = ({ 
  onShare, icon, label, color 
}) => (
  <button 
    onClick={onShare}
    className={`flex flex-col items-center justify-center p-3 rounded-lg ${color} transition-all duration-200 hover:scale-105`}
  >
    <span className="text-lg mb-1">{icon}</span>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const RadarChart: React.FC<{ skills: SkillScores }> = ({ skills }) => {
  const center = 150;
  const maxRadius = 120;
  const skillOrder: (keyof SkillScores)[] = ['logic', 'visual', 'speed', 'math', 'memory'];
  const angles = skillOrder.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);
  
  const points = skillOrder.map((skill, i) => {
    const value = skills[skill] / 100;
    const radius = value * maxRadius;
    const x = center + radius * Math.cos(angles[i]);
    const y = center + radius * Math.sin(angles[i]);
    return { x, y, skill };
  });
  
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative mx-auto" style={{ width: '280px', height: '280px' }}>
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Background Grid */}
        <g className="opacity-30" stroke="#e5e7eb" strokeWidth="1" fill="none">
          <circle cx="150" cy="150" r="120" />
          <circle cx="150" cy="150" r="90" />
          <circle cx="150" cy="150" r="60" />
          <circle cx="150" cy="150" r="30" />
          <line x1="150" y1="30" x2="150" y2="270" />
          <line x1="30" y1="150" x2="270" y2="150" />
          <line x1="67" y1="67" x2="233" y2="233" />
          <line x1="233" y1="67" x2="67" y2="233" />
        </g>
        
        {/* Skill Polygon */}
        <motion.polygon
          points={pointsStr}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        {/* Skill Points */}
        {points.map((point, i) => (
          <motion.circle
            key={skillOrder[i]}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.2 + 1, duration: 0.3 }}
          />
        ))}
      </svg>
    </div>
  );
};

export default function ResultComponent({ results, onRetake, onHome }: ResultComponentProps) {
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [skills, setSkills] = useState<SkillScores>({ logic: 0, visual: 0, speed: 0, math: 0, memory: 0 });
  const badgeInfo = getBadgeInfo(results.score);

  // Calculate skills based on answer details
  useEffect(() => {
    const calculateSkills = (): SkillScores => {
      const base = Math.max(50, Math.min(95, results.score * 0.7 + 15));
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

      return {
        logic: Math.round(base + (typePerformance.logic?.correct || 0) / (typePerformance.logic?.total || 1) * 30 - 15),
        visual: Math.round(base + (typePerformance.spatial?.correct || 0) / (typePerformance.spatial?.total || 1) * 30 - 15),
        speed: Math.round(base + (results.timeTaken < results.timeLimit * 0.7 ? 20 : -10)),
        math: Math.round(base + (typePerformance.math?.correct || 0) / (typePerformance.math?.total || 1) * 30 - 15),
        memory: Math.round(base + (results.completionRate > 0.8 ? 15 : -5))
      };
    };

    setSkills(calculateSkills());
  }, [results]);

  // Trigger confetti on mount
  useEffect(() => {
    if (results.score >= 115) {
      setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      }, 500);
    }
  }, [results.score]);

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Tôi vừa đạt ${results.score} điểm IQ! 🧠✨ Thử sức với bài test này nhé!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Tôi vừa đạt ${results.score} điểm IQ! 🧠✨ #IQTest #BrainPower`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`🧠 Tôi vừa đạt ${results.score} điểm IQ! 

🎯 Vượt qua ${results.percentile}% dân số thế giới
✨ Bạn có thể đạt được bao nhiêu điểm?

Thử ngay test IQ này!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('🔗 Đã copy link thành công!');
    }).catch(() => {
      alert('❌ Không thể copy link');
    });
  };

  const getSkillLevel = (score: number): string => {
    if (score >= 85) return 'Xuất sắc';
    if (score >= 75) return 'Tốt';
    if (score >= 65) return 'Khá';
    return 'Cần cải thiện';
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

    const strengths: string[] = [];
    const improvements: string[] = [];

    Object.entries(typePerformance).forEach(([type, performance]) => {
      const percentage = (performance.correct / performance.total) * 100;
      const typeName = type === 'logic' ? 'Tư duy logic' : 
                      type === 'math' ? 'Toán học' :
                      type === 'spatial' ? 'Tư duy không gian' :
                      type === 'pattern' ? 'Nhận dạng mẫu' : type;
      
      if (percentage >= 70) {
        strengths.push(typeName);
      } else if (percentage < 50) {
        improvements.push(typeName);
      }
    });

    return { strengths, improvements };
  };

  const { strengths, improvements } = analyzeStrengths();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Result Card */}
        <motion.div 
          className="bg-white rounded-3xl shadow-md p-8 mb-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600"></div>
          </div>

          <div className="relative z-10">
            {/* Header Row with Badge and Quick Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${badgeInfo.color} flex items-center justify-center mr-4 shadow-lg`}>
                  <span className="text-white text-2xl">{badgeInfo.icon}</span>
                </div>
                <div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${badgeInfo.color} text-white font-semibold text-sm shadow-md`}>
                    <span className="mr-1">{badgeInfo.icon}</span>
                    {badgeInfo.label}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Vượt qua <span className="font-bold text-blue-600">{results.percentile}%</span> dân số</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex space-x-4 text-center">
                <div className="bg-green-50 rounded-xl px-3 py-2">
                  <div className="text-lg font-bold text-green-600">{Math.round(results.completionRate * 100)}%</div>
                  <div className="text-xs text-gray-500">Chính xác</div>
                </div>
                <div className="bg-blue-50 rounded-xl px-3 py-2">
                  <div className="text-lg font-bold text-blue-600">{formatTime(results.timeTaken)}</div>
                  <div className="text-xs text-gray-500">Thời gian</div>
                </div>
                <div className="bg-purple-50 rounded-xl px-3 py-2">
                  <div className="text-lg font-bold text-purple-600">{results.correctAnswers}/{results.totalQuestions}</div>
                  <div className="text-xs text-gray-500">Đúng/Tổng</div>
                </div>
              </div>
            </div>

            {/* Main Score Section */}
            <div className="text-center mb-8">
              <motion.h1 
                className="text-7xl md:text-8xl font-bold text-gray-900 mb-2 leading-none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                {results.score}
              </motion.h1>
              <p className="text-xl text-gray-600 mb-6">Chỉ số IQ của bạn</p>
              
              {/* Mini IQ Scale */}
              <div className="max-w-md mx-auto mb-6">
                <div className="relative h-3 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 rounded-full">
                  <motion.div 
                    className="absolute w-4 h-4 bg-white border-3 border-blue-600 rounded-full shadow-md transform -translate-y-0.5 -translate-x-2"
                    style={{ left: `${Math.min(Math.max(((results.score - 70) / 75) * 100, 0), 100)}%` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>70</span>
                  <span>100</span>
                  <span>130</span>
                  <span>145+</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Làm lại IQ Button */}
              <motion.button
                onClick={onRetake}
                className="group bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mr-2 group-hover:rotate-180 transition-transform duration-300">🔄</span>
                <span className="text-sm">Làm lại IQ</span>
              </motion.button>

              {/* Trang chủ Button */}
              <motion.button
                onClick={onHome}
                className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mr-2">🏠</span>
                <span className="text-sm">Trang chủ</span>
              </motion.button>

              {/* Test EQ Button */}
              <motion.button
                onClick={() => window.location.href = '/test/eq'}
                className="group bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mr-2 group-hover:scale-110 transition-transform duration-300">❤️</span>
                <span className="text-sm">Test EQ</span>
              </motion.button>

              {/* Bảng xếp hạng Button */}
              <motion.button
                onClick={() => window.location.href = '/leaderboard'}
                className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mr-2 group-hover:bounce transition-transform duration-300">🏆</span>
                <span className="text-sm">Bảng xếp hạng</span>
              </motion.button>

              {/* Chia sẻ Button với Dropdown */}
              <div className="relative">
                <motion.button 
                  onClick={() => setShowShareDropdown(!showShareDropdown)}
                  className="group w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mr-2">📤</span>
                  <span className="text-sm">Chia sẻ</span>
                  <span className={`ml-1 transition-transform duration-200 ${showShareDropdown ? 'rotate-180' : ''}`}>⬇️</span>
                </motion.button>

                <AnimatePresence>
                  {showShareDropdown && (
                    <motion.div 
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-md border border-gray-100 z-50"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div className="p-3">
                        <div className="grid grid-cols-4 gap-2">
                          <ShareButton onShare={shareToFacebook} icon="📘" label="Facebook" color="bg-blue-50 hover:bg-blue-100 text-blue-600" />
                          <ShareButton onShare={shareToTwitter} icon="🐦" label="Twitter" color="bg-gray-50 hover:bg-gray-100 text-gray-700" />
                          <ShareButton onShare={shareToWhatsApp} icon="💬" label="WhatsApp" color="bg-green-50 hover:bg-green-100 text-green-600" />
                          <ShareButton onShare={copyLink} icon="🔗" label="Copy" color="bg-purple-50 hover:bg-purple-100 text-purple-600" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Score Comparison Chart */}
        <motion.div 
          className="bg-white rounded-2xl shadow-md p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3 text-indigo-600">📊</span>
            So sánh với cộng đồng
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Distribution Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố điểm IQ</h3>
              <div className="space-y-3">
                {[
                  { label: 'Thiên tài (140+)', width: 2, color: 'purple', isUser: results.score >= 140 },
                  { label: 'Xuất sắc (130-139)', width: 6, color: 'blue', isUser: results.score >= 130 && results.score < 140 },
                  { label: 'Trên TB (115-129)', width: 14, color: 'green', isUser: results.score >= 115 && results.score < 130 },
                  { label: 'Trung bình (85-114)', width: 68, color: 'yellow', isUser: results.score >= 85 && results.score < 115 },
                  { label: 'Dưới TB (70-84)', width: 10, color: 'orange', isUser: results.score >= 70 && results.score < 85 }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex-1 mx-3 h-3 bg-gray-100 rounded-full relative">
                      <motion.div 
                        className={`h-3 bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 rounded-full`}
                        style={{ width: `${item.width}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.width}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      />
                      {item.isUser && (
                        <motion.div 
                          className={`absolute top-0 right-0 w-3 h-3 bg-white border-2 border-${item.color}-600 rounded-full transform translate-x-1`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.3 + index * 0.1 }}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.width}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Your Position */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vị trí của bạn</h3>
              <div className="space-y-4">
                <motion.div 
                  className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    #{Math.ceil((100 - results.percentile) / 100 * 1000)}
                  </div>
                  <p className="text-sm text-gray-600">Trong 1000 người</p>
                </motion.div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{results.percentile}%</div>
                    <p className="text-xs text-gray-600">Cao hơn</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{100 - results.percentile}%</div>
                    <p className="text-xs text-gray-600">Thấp hơn</p>
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full">
                    <span className="text-emerald-600 mr-2">🏆</span>
                    <span className="text-sm font-medium text-emerald-800">
                      {results.score >= 130 ? 'Top 6% xuất sắc!' : 
                       results.score >= 115 ? 'Top 20% trên trung bình!' : 
                       'Điểm tốt, tiếp tục cố gắng!'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
          
        {/* Analysis Section */}
        <motion.div 
          className="bg-white rounded-2xl shadow-md p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3 text-blue-600">📊</span>
            Phân tích chi tiết
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Điểm mạnh
              </h3>
              <div className="space-y-3">
                {strengths.length > 0 ? strengths.map((strength, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center p-3 bg-green-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <span className="text-green-500 mr-3">✅</span>
                    <span className="text-gray-700">{strength}</span>
                  </motion.div>
                )) : (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-500 mr-3">✅</span>
                    <span className="text-gray-700">Tư duy tổng hợp tốt</span>
                  </div>
                )}
              </div>
            </div>

            {/* Improvements */}
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Cơ hội phát triển
              </h3>
              <div className="space-y-3">
                {improvements.length > 0 ? improvements.map((area, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center p-3 bg-orange-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <span className="text-orange-500 mr-3">🧠</span>
                    <span className="text-gray-700">{area}</span>
                  </motion.div>
                )) : (
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-500 mr-3">🧠</span>
                    <span className="text-gray-700">Luyện tập thêm để nâng cao</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skill Breakdown Section */}
        <motion.div 
          className="bg-white rounded-2xl shadow-md p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3 text-purple-600">🧠</span>
            Phân tích theo kỹ năng
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <div className="relative">
              <RadarChart skills={skills} />
            </div>
            
            {/* Skills List */}
            <div className="space-y-4">
              {[
                { key: 'logic', icon: '🧠', title: 'Logic & Suy luận', desc: 'Giải quyết vấn đề, chuỗi lập luận', bg: 'bg-blue-50', color: 'text-blue-600' },
                { key: 'visual', icon: '👁️', title: 'Tư duy trực quan', desc: 'Nhận diện mẫu, hình khối', bg: 'bg-green-50', color: 'text-green-600' },
                { key: 'speed', icon: '⏱️', title: 'Phản xạ & tốc độ', desc: 'Trả lời nhanh & chính xác', bg: 'bg-amber-50', color: 'text-amber-600' },
                { key: 'math', icon: '📐', title: 'Khả năng toán học', desc: 'Dạng số học, dãy số logic', bg: 'bg-purple-50', color: 'text-purple-600' },
                { key: 'memory', icon: '🔄', title: 'Ghi nhớ & tập trung', desc: 'Giữ thông tin & duy trì chú ý', bg: 'bg-red-50', color: 'text-red-600' }
              ].map((skill, index) => (
                <motion.div 
                  key={skill.key}
                  className={`flex items-center justify-between p-4 ${skill.bg} rounded-xl hover:shadow-md transition-all duration-200`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${skill.bg.replace('50', '500')} rounded-lg flex items-center justify-center mr-4`}>
                      <span className="text-white text-lg">{skill.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{skill.title}</h3>
                      <p className="text-sm text-gray-600">{skill.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${skill.color}`}>
                      {skills[skill.key as keyof SkillScores]}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {getSkillLevel(skills[skill.key as keyof SkillScores])}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Social Sharing - Simplified */}
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-3">💡 Mẹo nhỏ</h2>
          <p className="text-gray-600 text-sm">Chia sẻ kết quả để thử thách bạn bè của bạn! Ai sẽ có điểm cao hơn? 🎯</p>
        </motion.div>
      </div>
    </div>
  );
}