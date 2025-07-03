interface TestState {
  currentQuestion: number;
  answers: (number | null)[];
  timeElapsed: number; // seconds elapsed
  startTime: number; // timestamp when test started
  totalTime: number; // total time limit in seconds
  isCompleted?: boolean; // Flag for completed but not viewed tests
  completedAt?: number; // Timestamp when test was completed
  lastSavedAt?: number; // Timestamp when test was last saved
}

const TEST_STATE_KEY = 'iq_test_state';

export function saveTestState(state: TestState): void {
  try {
    const stateWithTimestamp = {
      ...state,
      lastSavedAt: Date.now()
    };
    localStorage.setItem(TEST_STATE_KEY, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.warn('Failed to save test state:', error);
  }
}

export function loadTestState(): TestState | null {
  try {
    const saved = localStorage.getItem(TEST_STATE_KEY);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as TestState;
    
    // Validate state structure
    if (typeof state.currentQuestion !== 'number' ||
        !Array.isArray(state.answers) ||
        typeof state.timeElapsed !== 'number' ||
        typeof state.startTime !== 'number' ||
        typeof state.totalTime !== 'number') {
      return null;
    }
    
    return state;
  } catch (error) {
    console.warn('Failed to load test state:', error);
    return null;
  }
}

export function clearTestState(): void {
  try {
    localStorage.removeItem(TEST_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear test state:', error);
  }
}

export function getAccurateTimeElapsed(): number {
  try {
    const state = loadTestState();
    if (!state) return 0;
    
    // Nếu test đã được bắt đầu nhưng không hoàn thành và có lastSavedAt
    if (state.startTime && !state.isCompleted && state.lastSavedAt) {
      // Tính toán thời gian đã trôi qua kể từ lúc bắt đầu
      return state.timeElapsed;
    }
    
    // Nếu không có thông tin để tính toán chính xác, trả về timeElapsed đã lưu
    return state.timeElapsed || 0;
  } catch (error) {
    console.warn('Failed to calculate accurate time elapsed:', error);
    return 0;
  }
}

// Hàm kiểm tra xem có bài test đang làm dở không
export function hasInProgressTest(): boolean {
  const state = loadTestState();
  if (!state) return false;
  
  // Nếu đã hoàn thành, không tính là đang làm dở
  if (state.isCompleted) return false;
  
  // Nếu đã quá 30 ngày, không tính là đang làm dở
  if (state.lastSavedAt && Date.now() - state.lastSavedAt > 30 * 24 * 60 * 60 * 1000) {
    clearTestState(); // Tự động xóa trạng thái quá cũ
    return false;
  }
  
  return true;
}

// Hàm lấy thông tin chi tiết về bài test đang làm dở
export function getInProgressTestInfo(): {
  currentQuestion: number,
  totalQuestions: number,
  answeredQuestions: number,
  timeRemaining: number,
  daysAgo: number
} | null {
  const state = loadTestState();
  if (!state) return null;
  
  // Tính toán thời gian còn lại chính xác
  const timeRemaining = Math.max(0, state.totalTime - state.timeElapsed);
  
  // Tính số ngày đã trôi qua từ lần cuối lưu
  const daysAgo = state.lastSavedAt 
    ? Math.floor((Date.now() - state.lastSavedAt) / (24 * 60 * 60 * 1000))
    : 0;
  
  // Đếm số câu đã trả lời (các giá trị không phải null trong mảng answers)
  const answeredQuestions = state.answers.filter(answer => answer !== null).length;
  
  return {
    currentQuestion: state.currentQuestion,
    totalQuestions: state.answers.length,
    answeredQuestions,
    timeRemaining,
    daysAgo
  };
} 