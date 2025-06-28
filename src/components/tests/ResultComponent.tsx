import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DetailedAnalysis from './DetailedAnalysis';

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

interface SkillData {
  name: string;
  score: number;
  level: string;
  description: string;
  color: string;
  icon: string;
}

interface TestHistoryItem {
  id: number;
  date: string;
  score: number;
  percentile: number;
  timeTaken: number;
  improvement: number;
  isFirst?: boolean;
  isCurrent?: boolean;
}

// Convert real test history to timeline format
const convertRealHistoryToTimeline = (realHistory: any[], currentResult: ResultData): TestHistoryItem[] => {
  console.log('🔄 Converting history to timeline. Input:', realHistory.length, 'items');
  console.log('📊 Sample history item:', realHistory[0]);
  
  // Current test data from ResultData
  const currentTest = {
    id: Date.now(), // Unique ID
    date: new Date().toLocaleDateString('vi-VN'),
    score: currentResult.score,
    percentile: currentResult.percentile,
    timeTaken: Math.round(currentResult.timeTaken / 60), // Convert seconds to minutes
    improvement: 0, // Will calculate below
    isFirst: false,
    isCurrent: true
  };

  if (!realHistory || realHistory.length === 0) {
    // No history - this is first test
    console.log('✅ First time user - showing welcome message');
    return [{
      ...currentTest,
      isFirst: true,
      improvement: 0
    }];
  }

  // Filter out current test if it already exists in history (avoid duplicate)
  // Use a more relaxed filter - only filter if very recent (last 5 minutes)
  const filteredHistory = realHistory.filter(test => {
    if (!test.timestamp) return true; // Keep tests without timestamp
    const testTime = new Date(test.timestamp).getTime();
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - testTime);
    return timeDiff > 5 * 60 * 1000; // More than 5 minutes difference
  });

  console.log('📊 Filtered history:', filteredHistory.length, 'items (removed recent duplicates)');

  // Create timeline: current test + historical tests (show up to 10 most recent)
  const timeline: TestHistoryItem[] = [];
  
  // Add current test first (newest)
  if (filteredHistory.length > 0) {
    currentTest.improvement = currentResult.score - filteredHistory[0].iq;
  }
  timeline.push(currentTest);

  // Add historical tests (limit to 9 more for performance)
  const historyToShow = filteredHistory.slice(0, 9);
  historyToShow.forEach((test, index) => {
    const date = test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
    const timeTakenMinutes = Math.round((test.timeSpent || 0) / 60);
    
    // Calculate improvement from previous test
    let improvement = 0;
    if (index < historyToShow.length - 1) {
      improvement = test.iq - historyToShow[index + 1].iq;
    }
    
    timeline.push({
      id: test.timestamp || (Date.now() - (index + 1) * 1000),
      date,
      score: test.iq,
      percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
      timeTaken: timeTakenMinutes,
      improvement,
      isFirst: index === historyToShow.length - 1, // Last in shown array (oldest shown)
      isCurrent: false
    });
  });

  console.log('✅ Timeline created:', timeline.length, 'items total');
  console.log('📊 Total history available:', realHistory.length, 'items');
  
  return timeline;
};

// Skill analysis data
const getSkillAnalysis = (results: ResultData): SkillData[] => {
  const base = Math.max(50, Math.min(95, results.score * 0.7 + 15));
  
  return [
    {
      name: 'Tư duy Logic',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Xuất sắc',
      description: 'Khả năng phân tích và giải quyết vấn đề',
      color: 'blue',
      icon: '🧠'
    },
    {
      name: 'Toán học',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Tốt',
      description: 'Xử lý số và pattern toán học',
      color: 'purple',
      icon: '🔢'
    },
    {
      name: 'Ngôn ngữ',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Khá',
      description: 'Hiểu và xử lý thông tin ngôn ngữ',
      color: 'green',
      icon: '📝'
    },
    {
      name: 'Không gian',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Tốt',
      description: 'Hình dung và xoay đối tượng 3D',
      color: 'orange',
      icon: '🎯'
    },
    {
      name: 'Trí nhớ',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Xuất sắc',
      description: 'Ghi nhớ và truy xuất thông tin',
      color: 'pink',
      icon: '💾'
    },
    {
      name: 'Tốc độ',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Khá',
      description: 'Xử lý thông tin nhanh chóng',
      color: 'yellow',
      icon: '⚡'
    }
  ];
};

// Career suggestions
const getCareerSuggestions = (score: number) => [
  { name: 'Kỹ sư phần mềm', match: 98, salary: '25-50 triệu', icon: '💻' },
  { name: 'Bác sĩ', match: 95, salary: '30-80 triệu', icon: '👨‍⚕️' },
  { name: 'Nhà khoa học', match: 92, salary: '20-40 triệu', icon: '🔬' },
  { name: 'Kiến trúc sư', match: 88, salary: '20-45 triệu', icon: '🏗️' },
  { name: 'Giáo viên', match: 85, salary: '15-30 triệu', icon: '👨‍🏫' }
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getIQLevel = (score: number) => {
  if (score >= 140) return { level: 'Thiên tài', color: 'purple', icon: '��' };
  if (score >= 130) return { level: 'Xuất sắc', color: 'blue', icon: '🏆' };
  if (score >= 115) return { level: 'Trên TB', color: 'green', icon: '⭐' };
  if (score >= 85) return { level: 'Trung bình', color: 'yellow', icon: '✅' };
  return { level: 'Dưới TB', color: 'orange', icon: '📈' };
};

export default function ResultComponent({ results, onRetake, onHome }: ResultComponentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [animationComplete, setAnimationComplete] = useState(false);
  const [realTestHistory, setRealTestHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAllTestsModal, setShowAllTestsModal] = useState(false);
  
  const skills = getSkillAnalysis(results);
  const careers = getCareerSuggestions(results.score);
  const iqLevel = getIQLevel(results.score);
  
  // Load real test history on mount
  useEffect(() => {
    const loadTestHistory = async () => {
      try {
        const { getUserRealTestHistory } = await import('../../utils/test');
        const history = await getUserRealTestHistory();
        setRealTestHistory(history);
        console.log('📊 Loaded real test history:', history.length, 'tests');
        console.log('📊 History data:', history);
      } catch (error) {
        console.warn('⚠️ Error loading test history:', error);
        setRealTestHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadTestHistory();
  }, []);
  
  // Convert real history to timeline format
  const testHistory = convertRealHistoryToTimeline(realTestHistory, results);
  
  // Debug log timeline
  useEffect(() => {
    console.log('📊 Timeline generated:', testHistory.length, 'items');
    console.log('📊 Timeline data:', testHistory);
  }, [testHistory]);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const TestHistory = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">📈</span>
        Lịch sử tiến bộ
        {isLoadingHistory && (
          <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )}
        {!isLoadingHistory && realTestHistory.length > 0 && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {realTestHistory.length + 1} bài test
          </span>
        )}
      </h3>
      
      {isLoadingHistory ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 bg-gray-50 rounded-xl p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : testHistory.length === 1 ? (
        // First time user - welcome message
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            🎉
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">Chúc mừng bài test đầu tiên!</h4>
          <p className="text-gray-600 mb-4">Đây là điểm baseline của bạn. Hãy quay lại để theo dõi sự tiến bộ!</p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-sm mx-auto">
            <div className="text-2xl font-bold text-blue-600">{testHistory[0].score}</div>
            <div className="text-sm text-gray-600">Điểm IQ hiện tại</div>
          </div>
        </div>
      ) : (
        // Multiple tests - timeline view
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-200 via-green-200 to-blue-200"></div>
          
          {testHistory.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative flex items-center space-x-4 pb-6 ${index === testHistory.length - 1 ? 'pb-0' : ''}`}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                test.isCurrent 
                  ? 'bg-purple-500 border-purple-500 shadow-lg' 
                  : test.isFirst 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-green-500 border-green-500'
              }`}>
                {test.isCurrent && (
                  <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-75"></div>
                )}
              </div>
              
              {/* Content */}
              <div className={`flex-1 p-4 rounded-xl border transition-all hover:shadow-md ${
                test.isCurrent 
                  ? 'bg-purple-50 border-purple-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-gray-900">
                      {test.isFirst ? 'Lần đầu tiên' : test.isCurrent ? 'Hôm nay' : 'Lần trước'}
                    </h4>
                    {test.isCurrent && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Mới nhất</span>}
                  </div>
                  <span className="text-sm text-gray-500">{test.date}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      test.isCurrent ? 'text-purple-600' : 'text-gray-700'
                    }`}>
                      {test.score}
                    </div>
                    <div className="text-xs text-gray-500">IQ Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${
                      test.improvement > 0 ? 'text-green-600' : 
                      test.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {test.improvement > 0 ? '+' : ''}{test.improvement || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {test.isFirst ? 'Baseline' : 'Tiến bộ'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {test.timeTaken > 0 ? `${test.timeTaken}m` : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Thời gian</div>
                  </div>
                </div>
                
                {test.improvement > 0 && (
                  <div className="mt-3 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                    🎉 Cải thiện {test.improvement} điểm!
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Show "View All" if there are more tests */}
          {realTestHistory.length > 9 && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-500 mb-2">
                Hiển thị 10 bài test gần nhất. Còn {realTestHistory.length - 9} bài test nữa.
              </div>
              <button 
                onClick={() => setShowAllTestsModal(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
              >
                Xem tất cả {realTestHistory.length + 1} bài test
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Progress summary - only show for multiple tests */}
      {!isLoadingHistory && testHistory.length > 1 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Tổng tiến bộ</h4>
              <p className="text-sm text-gray-600">So với lần đầu tiên ({testHistory.length} bài test)</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                +{testHistory[0].score - testHistory[testHistory.length - 1].score}
              </div>
              <div className="text-sm text-gray-500">điểm IQ</div>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-blue-500">⚡</span>
              <span className="text-gray-600">
                {(() => {
                  const oldestTime = testHistory[testHistory.length - 1].timeTaken;
                  const newestTime = testHistory[0].timeTaken;
                  if (oldestTime > 0 && newestTime > 0) {
                    const timeDiff = oldestTime - newestTime;
                    return timeDiff > 0 ? `Nhanh hơn ${timeDiff} phút` : 'Tốc độ ổn định';
                  }
                  return 'Theo dõi tốc độ';
                })()}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-500">📊</span>
              <span className="text-gray-600">
                Vượt thêm {Math.max(0, testHistory[0].percentile - testHistory[testHistory.length - 1].percentile)}% dân số
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-purple-500">📈</span>
              <span className="text-gray-600">
                Tốc độ cải thiện: {Math.round((testHistory[0].score - testHistory[testHistory.length - 1].score) / (testHistory.length - 1))} điểm/test
              </span>
            </div>
          </div>
          
          {/* Mini chart visual */}
          <div className="mt-4 flex items-end space-x-1 h-8">
            {testHistory.slice().reverse().map((test, index) => {
              const maxScore = Math.max(...testHistory.map(t => t.score));
              const minScore = Math.min(...testHistory.map(t => t.score));
              const range = maxScore - minScore || 1;
              const height = Math.max(8, ((test.score - minScore) / range) * 24 + 8);
              
              return (
                <div
                  key={test.id}
                  className={`flex-1 rounded-t transition-all duration-500 ${
                    test.isCurrent ? 'bg-purple-500' : 'bg-blue-400'
                  }`}
                  style={{ height: `${height}px` }}
                  title={`Test ${index + 1}: ${test.score} điểm`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Cũ nhất</span>
            <span>Mới nhất</span>
          </div>
        </div>
      )}
    </div>
  );

  const PersonalProfile = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {results.score}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Kết quả của bạn</h3>
          <p className="text-sm text-gray-600">{new Date().toLocaleDateString('vi-VN')}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${iqLevel.color}-100 text-${iqLevel.color}-700`}>
              {iqLevel.icon} {iqLevel.level}
            </span>
            <span className="text-xs text-gray-500">Vượt {results.percentile}% dân số</span>
          </div>
        </div>
      </div>
    </div>
  );

  const HeroSection = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10"></div>
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-7xl font-bold text-gray-900 mb-4"
        >
          {results.score}
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Chỉ số IQ của bạn</h1>
        <p className="text-gray-600 mb-6">
          Bạn thông minh hơn <span className="font-bold text-blue-600">{results.percentile}%</span> dân số thế giới
        </p>
        
        {/* IQ Scale */}
        <div className="max-w-md mx-auto">
          <div className="relative h-3 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-blue-400 rounded-full">
            <motion.div 
              className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-lg transform -translate-y-0.5 -translate-x-2"
              style={{ left: `${Math.min(Math.max(((results.score - 70) / 80) * 100, 0), 100)}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>70</span>
            <span>100</span>
            <span>130</span>
            <span>150+</span>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Chính xác', value: `${Math.round(results.completionRate * 100)}%`, color: 'green', icon: '🎯' },
        { label: 'Thời gian', value: formatTime(results.timeTaken), color: 'blue', icon: '⏱️' },
        { label: 'Đúng/Tổng', value: `${results.correctAnswers}/${results.totalQuestions}`, color: 'purple', icon: '📊' },
        { label: 'Percentile', value: `${results.percentile}%`, color: 'yellow', icon: '🏆' }
      ].map((stat, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-${stat.color}-50 rounded-xl p-4 text-center`}
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</div>
          <div className="text-xs text-gray-600">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );

  const SkillsRadar = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">🎯</span>
        Phân tích kỹ năng chi tiết
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {skills.map((skill, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className={`w-12 h-12 bg-${skill.color}-100 rounded-full flex items-center justify-center text-xl`}>
              {skill.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                <span className={`text-sm font-bold text-${skill.color}-600`}>{skill.score}%</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{skill.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className={`bg-${skill.color}-500 h-2 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.score}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const CareerSuggestions = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">💼</span>
        Nghề nghiệp phù hợp
      </h3>
      
      <div className="space-y-4">
        {careers.map((career, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{career.icon}</div>
              <div>
                <h4 className="font-semibold text-gray-900">{career.name}</h4>
                <p className="text-sm text-gray-600">Lương: {career.salary}/tháng</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">{career.match}%</div>
              <div className="text-xs text-gray-500">Phù hợp</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const TabNavigation = () => (
    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
      <div className="flex space-x-2">
        {[
          { id: 'overview', label: 'Tổng quan', icon: '📊' },
          { id: 'analysis', label: 'Phân tích', icon: '🔍' },
          { id: 'career', label: 'Nghề nghiệp', icon: '💼' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Làm lại', icon: '🔄', color: 'gray', onClick: onRetake },
        { label: 'Trang chủ', icon: '🏠', color: 'blue', onClick: onHome },
        { label: 'Test EQ', icon: '❤️', color: 'pink', onClick: () => window.location.href = '/test/eq' },
        { label: 'Chia sẻ', icon: '📤', color: 'green', onClick: () => navigator.share?.({ title: `IQ ${results.score}`, text: `Tôi đạt ${results.score} điểm IQ!` }) || navigator.clipboard.writeText(window.location.href) }
      ].map((btn, index) => (
        <motion.button
          key={index}
          onClick={btn.onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-3 rounded-xl font-medium text-white bg-${btn.color}-500 hover:bg-${btn.color}-600 transition-colors flex items-center justify-center space-x-2`}
        >
          <span>{btn.icon}</span>
          <span className="text-sm">{btn.label}</span>
        </motion.button>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <QuickStats />
            <SkillsRadar />
            <TestHistory />
          </>
        );
      case 'analysis':
        return (
          <DetailedAnalysis 
            score={results.score}
            percentile={results.percentile}
            timeTaken={results.timeTaken}
            accuracy={Math.round(results.completionRate * 100)}
          />
        );
      case 'career':
        return <CareerSuggestions />;
      default:
        return null;
    }
  };

  const AllTestsModal = () => {
    const allTests = [
      // Current test first
      {
        id: Date.now(),
        date: new Date().toLocaleDateString('vi-VN'),
        score: results.score,
        percentile: results.percentile,
        timeTaken: Math.round(results.timeTaken / 60),
        accuracy: Math.round(results.completionRate * 100),
        improvement: realTestHistory.length > 0 ? results.score - realTestHistory[0].iq : 0,
        isCurrent: true
      },
      // Historical tests
      ...realTestHistory.map((test, index) => ({
        id: test.timestamp || Date.now() - index,
        date: test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : 'N/A',
        score: test.iq,
        percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
        timeTaken: Math.round((test.timeSpent || 0) / 60),
        accuracy: test.detailed?.accuracy || 0,
        improvement: index < realTestHistory.length - 1 ? test.iq - realTestHistory[index + 1].iq : 0,
        isCurrent: false
      }))
    ];

    const stats = {
      total: allTests.length,
      avgScore: Math.round(allTests.reduce((sum, test) => sum + test.score, 0) / allTests.length),
      maxScore: Math.max(...allTests.map(test => test.score)),
      minScore: Math.min(...allTests.map(test => test.score)),
      totalImprovement: allTests[0].score - allTests[allTests.length - 1].score
    };

    // Close modal on Escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowAllTestsModal(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && setShowAllTestsModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Lịch sử IQ Test</h2>
                <p className="text-blue-100">Tất cả {stats.total} bài test của bạn</p>
              </div>
              <button
                onClick={() => setShowAllTestsModal(false)}
                className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{stats.avgScore}</div>
                <div className="text-sm text-blue-100">Điểm TB</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{stats.maxScore}</div>
                <div className="text-sm text-blue-100">Cao nhất</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">+{stats.totalImprovement}</div>
                <div className="text-sm text-blue-100">Tiến bộ</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{stats.total}</div>
                <div className="text-sm text-blue-100">Tổng test</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-3">
              {allTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    test.isCurrent 
                      ? 'bg-purple-50 border-purple-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        test.isCurrent ? 'bg-purple-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {test.isCurrent ? 'Hôm nay (Mới nhất)' : `Test #${stats.total - index}`}
                        </h4>
                        <p className="text-sm text-gray-500">{test.date}</p>
                      </div>
                      {test.isCurrent && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        test.isCurrent ? 'text-purple-600' : 'text-gray-700'
                      }`}>
                        {test.score}
                      </div>
                      <div className="text-xs text-gray-500">IQ Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{test.percentile}%</div>
                      <div className="text-xs text-gray-500">Percentile</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{test.accuracy}%</div>
                      <div className="text-xs text-gray-500">Chính xác</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">{test.timeTaken}m</div>
                      <div className="text-xs text-gray-500">Thời gian</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        test.improvement > 0 ? 'text-green-600' : 
                        test.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {test.improvement > 0 ? '+' : ''}{test.improvement || '—'}
                      </div>
                      <div className="text-xs text-gray-500">Tiến bộ</div>
                    </div>
                  </div>

                  {test.improvement > 0 && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-green-600 text-sm">🎉</span>
                      <span className="text-green-600 text-sm font-medium">
                        Cải thiện {test.improvement} điểm so với lần trước!
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Tổng cộng {stats.total} bài test • Tiến bộ {stats.totalImprovement} điểm
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAllTestsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowAllTestsModal(false);
                    onRetake();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Làm test mới
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          {/* Personal Profile */}
          <PersonalProfile />
          
          {/* Hero Section */}
          <HeroSection />
          
          {/* Tab Navigation */}
          <TabNavigation />
          
          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
          
          {/* Action Buttons */}
          <ActionButtons />
          
          {/* All Tests Modal */}
          <AnimatePresence>
            {showAllTestsModal && <AllTestsModal />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}