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