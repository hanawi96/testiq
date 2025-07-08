import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultHero from '../common/ResultHero';
import QuickStats from '../common/QuickStats';
import TestHistory from '../common/TestHistory';
import ResultTabs from '../common/ResultTabs';
import IQSkillsAnalysis from './IQSkillsAnalysis';
import IQCareerSuggestions from './IQCareerSuggestions';
import DetailedAnalysis from '../common/DetailedAnalysis';
import Confetti, { useConfetti } from '../../../common/effects/Confetti';
import { convertRealHistoryToTimeline } from '../common/utils';
import { getIQLevel, getSkillAnalysis, getCareerSuggestions } from './types';
import type { ResultComponentProps } from '../common/types';

const IQResultView: React.FC<ResultComponentProps> = ({ 
  results, 
  userInfo: propUserInfo, 
  onRetake, 
  onHome 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTestHistory, setRealTestHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [userInfo, setUserInfo] = useState<{name: string, age: string, location: string}>({ 
    name: 'Bạn', age: '', location: '' 
  });
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { fireSingle } = useConfetti();
  
  // Memoized static data to prevent recalculation
  const skills = useMemo(() => getSkillAnalysis(results), [results]);
  const careers = useMemo(() => getCareerSuggestions(results.score), [results.score]);
  const iqLevel = useMemo(() => getIQLevel(results.score), [results.score]);
  
  // Remove fullscreen-test class when results are displayed
  useEffect(() => {
    // Đảm bảo header và footer được hiển thị khi xem kết quả
    document.body.classList.remove('fullscreen-test');
    
    // Hiển thị trực tiếp header và footer
    const headerElement = document.querySelector('header');
    const footerElement = document.querySelector('footer');
    
    if (headerElement) {
      headerElement.style.display = '';
      headerElement.style.visibility = '';
      headerElement.style.opacity = '';
    }
    
    if (footerElement) {
      footerElement.style.display = '';
      footerElement.style.visibility = '';
      footerElement.style.opacity = '';
    }
    
    return () => {
      // Không cần thêm lại class khi component unmount
    };
  }, []);
  
  // Single useEffect for all data loading
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // ALWAYS use prop userInfo if available (from URL params)
        if (propUserInfo?.name) {
          setUserInfo({
            name: propUserInfo.name,
            age: propUserInfo.age || '',
            location: propUserInfo.location || ''
          });
          console.log('✅ Using userInfo from URL params:', propUserInfo);
        } else {
          // Only fallback to localStorage if no URL params
          const [testUtils] = await Promise.all([
            import('../../../../utils/testing/iq-test/core')
          ]);
          
          const anonymousInfo = testUtils.getAnonymousUserInfo();
          if (anonymousInfo) {
            setUserInfo({
              name: anonymousInfo.name || 'Bạn',
              age: anonymousInfo.age || '',
              location: anonymousInfo.location || ''
            });
            console.log('✅ Using userInfo from localStorage fallback');
          }
        }
        
        // Load test history
        const [testUtils] = await Promise.all([
          import('../../../../utils/testing/iq-test/core')
        ]);
        const history = await testUtils.getUserRealTestHistory();
        setRealTestHistory(history);
        
      } catch (error) {
        console.warn('⚠️ Error loading data:', error);
        setRealTestHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadAllData();
  }, [propUserInfo]);
  
  // Trigger confetti on mount
  useEffect(() => {
    // Trigger confetti after short delay
    const confettiTimer = setTimeout(() => {
      setShowConfetti(true);
      
      // Reset confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
      }, 1000);
    }, 500);

    return () => {
      clearTimeout(confettiTimer);
    };
  }, []);
  
  // Add debug helpers to global window for testing
  useEffect(() => {
    (window as any).clearTestData = () => {
      localStorage.removeItem('iq-test-history');
      localStorage.removeItem('current-test-result');
      localStorage.removeItem('anonymous-user-info');
      console.log('🗑️ All test data cleared! Please refresh page.');
    };
    
    (window as any).fixTestTimes = () => {
      try {
        const history = JSON.parse(localStorage.getItem('iq-test-history') || '[]');
        const fixed = history.map((test: any) => ({
          ...test,
          timeSpent: test.timeSpent < 60 ? Math.random() * 600 + 300 : test.timeSpent
        }));
        localStorage.setItem('iq-test-history', JSON.stringify(fixed));
        console.log('🔧 Fixed', fixed.length, 'test times! Please refresh page.');
      } catch (error) {
        console.error('Failed to fix test times:', error);
      }
    };
  }, []);
  
  // Convert real history to timeline format
  const testHistory = useMemo(() => 
    convertRealHistoryToTimeline(realTestHistory, results, 10),
    [realTestHistory, results]
  );

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: '📊' },
    { id: 'analysis', label: 'Phân tích', icon: '🔍' },
    { id: 'career', label: 'Nghề nghiệp', icon: '💼' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <QuickStats 
              completionRate={results.completionRate}
              timeTaken={results.timeTaken}
              correctAnswers={results.correctAnswers}
              totalQuestions={results.totalQuestions}
              percentile={results.percentile}
            />
            <IQSkillsAnalysis skills={skills} />
            <TestHistory 
              testHistory={testHistory} 
              isLoadingHistory={isLoadingHistory}
              realTestHistoryLength={realTestHistory.length}
            />
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
        return <IQCareerSuggestions careers={careers} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-8">
      <Confetti trigger={showConfetti} type="success" />

      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-8">
          {/* Hero Section */}
          <ResultHero
            score={results.score}
            percentile={results.percentile}
            iqLevel={iqLevel}
            userInfo={userInfo}
            onRetake={onRetake}
          />

          {/* Tab Navigation */}
          <ResultTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
          />

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IQResultView; 