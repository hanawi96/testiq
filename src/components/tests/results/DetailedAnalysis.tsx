import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnalysisProps {
  score: number;
  percentile: number;
  timeTaken: number;
  accuracy: number;
}

const DetailedAnalysis: React.FC<AnalysisProps> = ({ score, percentile, timeTaken, accuracy }) => {
  const [activeInsight, setActiveInsight] = useState(0);
  
  // Performance analysis
  const getPerformanceInsights = () => {
    const insights = [];
    
    if (accuracy > 90) {
      insights.push({
        type: 'strength',
        title: 'Độ chính xác xuất sắc',
        description: 'Bạn có khả năng tập trung cao và ít mắc lỗi sai sót',
        icon: '🎯',
        color: 'green'
      });
    }
    
    if (timeTaken < 1200) { // < 20 minutes
      insights.push({
        type: 'strength', 
        title: 'Tốc độ xử lý nhanh',
        description: 'Bạn có khả năng đưa ra quyết định nhanh chóng và chính xác',
        icon: '⚡',
        color: 'yellow'
      });
    }
    
    if (score >= 130) {
      insights.push({
        type: 'strength',
        title: 'Trí tuệ vượt trội',
        description: 'Chỉ có 2% dân số đạt được mức IQ như bạn',
        icon: '🌟',
        color: 'purple'
      });
    }
    
    insights.push({
      type: 'improvement',
      title: 'Phát triển tư duy sáng tạo',
      description: 'Thử các hoạt động nghệ thuật để kích thích não phải',
      icon: '🎨',
      color: 'pink'
    });
    
    return insights;
  };

  // Learning recommendations
  const getLearningRecommendations = () => [
    {
      category: 'Đọc sách',
      items: [
        '📚 "Thinking, Fast and Slow" - Daniel Kahneman',
        '📚 "Peak" - Anders Ericsson', 
        '📚 "The Art of Problem Solving" - Russell Ackoff'
      ],
      color: 'blue'
    },
    {
      category: 'Ứng dụng luyện tập',
      items: [
        '📱 Lumosity - Brain training games',
        '📱 Peak - Brain games & puzzles',
        '📱 Elevate - Brain training exercises'
      ],
      color: 'green'
    },
    {
      category: 'Hoạt động hàng ngày',
      items: [
        '🧩 Giải Sudoku & crossword puzzles',
        '♟️ Chơi cờ vua hoặc cờ tướng',
        '🎮 Strategy games & logic puzzles'
      ],
      color: 'purple'
    }
  ];

  // Lifestyle tips
  const getLifestyleTips = () => [
    {
      icon: '🥗',
      title: 'Dinh dưỡng não bộ',
      tips: ['Omega-3 từ cá hồi', 'Quả óc chó & hạnh nhân', 'Quả việt quất', 'Trà xanh']
    },
    {
      icon: '💪',
      title: 'Thể dục cho não',
      tips: ['Chạy bộ 30 phút/ngày', 'Yoga & thiền định', 'Bài tập cardio', 'Ngủ đủ 7-8 giờ']
    },
    {
      icon: '🧘',
      title: 'Rèn luyện tinh thần',
      tips: ['Thiền 10 phút/ngày', 'Viết nhật ký', 'Học ngôn ngữ mới', 'Luyện nhạc cụ']
    }
  ];

  const insights = getPerformanceInsights();
  const recommendations = getLearningRecommendations();
  const lifestyleTips = getLifestyleTips();

  const PerformanceChart = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">📊</span>
        So sánh với cộng đồng
      </h3>
      
      <div className="space-y-4">
        {[
          { label: 'Thiên tài (140+)', percent: 2, isUser: score >= 140 },
          { label: 'Xuất sắc (130-139)', percent: 6, isUser: score >= 130 && score < 140 },
          { label: 'Trên TB (115-129)', percent: 14, isUser: score >= 115 && score < 130 },
          { label: 'Trung bình (85-114)', percent: 68, isUser: score >= 85 && score < 115 },
          { label: 'Dưới TB (<85)', percent: 10, isUser: score < 85 }
        ].map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm text-gray-600">{item.label}</div>
            <div className="flex-1 mx-4 h-4 bg-gray-200 rounded-full relative overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${item.percent}%` }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              />
              {item.isUser && (
                <motion.div 
                  className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full transform translate-x-2 -translate-y-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                />
              )}
            </div>
            <div className="w-12 text-sm font-medium text-gray-900">{item.percent}%</div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center space-x-2 text-blue-800">
          <span className="text-xl">🎯</span>
          <span className="font-semibold">Vị trí của bạn:</span>
        </div>
        <p className="text-blue-700 mt-1">
          Top {100 - percentile}% toàn cầu - Thông minh hơn {percentile}% dân số thế giới
        </p>
      </div>
    </div>
  );

  const InsightsSection = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">💡</span>
        Phân tích chuyên sâu
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-l-4 border-${insight.color}-500 bg-${insight.color}-50`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <h4 className={`font-semibold text-${insight.color}-800`}>{insight.title}</h4>
                <p className={`text-sm text-${insight.color}-700 mt-1`}>{insight.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const RecommendationsSection = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">🚀</span>
        Lộ trình phát triển
      </h3>
      
      <div className="grid md:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`p-4 rounded-xl bg-${rec.color}-50 border border-${rec.color}-200`}
          >
            <h4 className={`font-semibold text-${rec.color}-800 mb-3`}>{rec.category}</h4>
            <ul className="space-y-2">
              {rec.items.map((item, i) => (
                <li key={i} className={`text-sm text-${rec.color}-700 flex items-start`}>
                  <span className="mr-2 text-xs">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const LifestyleSection = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">🌱</span>
        Lối sống tối ưu hóa trí não
      </h3>
      
      <div className="grid md:grid-cols-3 gap-6">
        {lifestyleTips.map((tip, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="text-4xl mb-3">{tip.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-3">{tip.title}</h4>
            <ul className="space-y-2">
              {tip.tips.map((item, i) => (
                <li key={i} className="text-sm text-gray-600">
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PerformanceChart />
      <InsightsSection />
      <RecommendationsSection />
      <LifestyleSection />
    </div>
  );
};

export default DetailedAnalysis; 