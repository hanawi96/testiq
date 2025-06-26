import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserInfo {
  name: string;
  age: string;
  location: string;
}

interface CongratulationsPopupProps {
  isOpen: boolean;
  onComplete: (userInfo: UserInfo) => Promise<void>;
  onConfettiTrigger?: () => void;
}

export default function CongratulationsPopup({ isOpen, onComplete, onConfettiTrigger }: CongratulationsPopupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', age: '', location: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const isFormValid = userInfo.name.trim() && userInfo.age.trim() && userInfo.location.trim();

  // Trigger confetti when popup opens
  React.useEffect(() => {
    if (isOpen && !hasTriggeredConfetti && onConfettiTrigger) {
      console.log('CongratulationsPopup: triggering confetti on open');
      onConfettiTrigger();
      setHasTriggeredConfetti(true);
    }
    if (!isOpen) {
      setHasTriggeredConfetti(false);
    }
  }, [isOpen, hasTriggeredConfetti, onConfettiTrigger]);

  const handleSubmit = async () => {
    if (!isFormValid || isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    // Analyze results for 1.5 seconds then call onComplete
    setTimeout(async () => {
      await onComplete(userInfo);
    }, 1500);
  };

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Chúc mừng!</h3>
              <p className="text-gray-600">Bạn đã hoàn thành xuất sắc bài test IQ</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isAnalyzing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    isAnalyzing ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Nhập họ tên của bạn"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tuổi *
                </label>
                <input
                  type="number"
                  value={userInfo.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  disabled={isAnalyzing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    isAnalyzing ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Nhập tuổi của bạn"
                  min="1"
                  max="120"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nơi ở *
                </label>
                <input
                  type="text"
                  value={userInfo.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={isAnalyzing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    isAnalyzing ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Nhập nơi ở của bạn"
                />
              </div>
            </div>
            
            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid || isAnalyzing}
              className={`w-full mt-6 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isFormValid && !isAnalyzing
                  ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={isFormValid && !isAnalyzing ? { scale: 1.02 } : {}}
              whileTap={isFormValid && !isAnalyzing ? { scale: 0.98 } : {}}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 mr-2 animate-spin" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <circle 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      className="opacity-25"
                    />
                    <path 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="opacity-75"
                    />
                  </svg>
                  Đang phân tích kết quả...
                </div>
              ) : (
                'Xem kết quả'
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { UserInfo }; 