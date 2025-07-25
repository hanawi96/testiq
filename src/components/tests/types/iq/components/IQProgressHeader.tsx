/**
 * Component hiển thị thanh tiến độ và thông tin bài test
 */
import React from 'react';
import ProgressBar from '../../../core/ProgressBar';

interface IQProgressHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  timeElapsed: number;
  timeLimit: number;
  isActive: boolean;
  onTimeUp: () => void;
  answers?: (number | null)[]; // Thêm prop answers để tính toán số câu đã trả lời chính xác
  onSubmit?: () => void; // Thêm prop để xử lý sự kiện nộp bài
}

const IQProgressHeader: React.FC<IQProgressHeaderProps> = ({
  currentQuestion,
  totalQuestions,
  timeElapsed,
  timeLimit,
  isActive,
  onTimeUp,
  answers = [],
  onSubmit
}) => {
  // Tính toán số câu đã trả lời dựa trên mảng answers thay vì currentQuestion
  const answeredCount = answers.length > 0 
    ? answers.filter(answer => answer !== null).length 
    : currentQuestion;

  // Tính tỷ lệ phần trăm hoàn thành
  const completionPercentage = Math.round((answeredCount / totalQuestions) * 100);
  
  // Tính số câu chưa trả lời
  const unansweredCount = totalQuestions - answeredCount;
  
  // Chọn màu dựa trên tỷ lệ hoàn thành
  const progressColor = 
    completionPercentage >= 75 ? 'bg-green-500' : 
    completionPercentage >= 50 ? 'bg-blue-500' : 
    completionPercentage >= 25 ? 'bg-yellow-500' : 
    'bg-red-500';
  
  // Phân loại trạng thái tiến độ
  const progressStatus = 
    completionPercentage >= 75 ? 'Hoàn thành tốt' : 
    completionPercentage >= 50 ? 'Đang tiến triển' : 
    completionPercentage >= 25 ? 'Mới bắt đầu' : 
    'Cần cố gắng hơn';

  return (
    <div className="progress-container">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-800 dark:text-white font-semibold text-lg">Tiến độ bài làm</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{progressStatus}</p>
          </div>
        </div>
        
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-1 text-center">
          <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">{completionPercentage}%</span>
        </div>
      </div>
      
      <div>
        <ProgressBar
          current={answeredCount}
          total={totalQuestions}
          className="w-full h-2.5 mb-4"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-3">
      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
          <div className="text-green-600 dark:text-green-400 font-bold text-xl">{currentQuestion + 1}/{totalQuestions}</div>
          <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap" style={{ fontSize: '13px' }}>Câu hiện tại</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
          <div className="text-blue-600 dark:text-blue-400 font-bold text-xl">{answeredCount}</div>
          <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap" style={{ fontSize: '13px' }}>Đã trả lời</div>
        </div>
        
        {unansweredCount > 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
          <div className="text-yellow-600 dark:text-yellow-400 font-bold text-xl">{unansweredCount}</div>
          <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap" style={{ fontSize: '13px' }}>Chưa trả lời</div>
        </div>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!onSubmit}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 text-center flex flex-col items-center justify-center transition-colors duration-200 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-w-[100px]"
          >
            <div className="font-bold text-xl flex items-center whitespace-nowrap">
              <svg className="w-5 h-5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="whitespace-nowrap">Nộp bài</span>
            </div>
            <div className="text-gray-100 whitespace-nowrap" style={{ fontSize: '13px' }}>Đã hoàn thành</div>
          </button>
        )}
        
        
      </div>
    </div>
  );
};

export default IQProgressHeader; 