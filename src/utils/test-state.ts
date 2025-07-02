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

export function hasInProgressTest(): boolean {
  const state = loadTestState();
  if (!state) {
    console.log('❌ No saved state found');
    return false;
  }
  
  // Check if test has meaningful progress (started test - has time elapsed or current question > 0)
  const answeredCount = state.answers.filter(a => a !== null).length;
  const hasStarted = state.timeElapsed > 0 || state.currentQuestion > 0;
  const hasProgress = hasStarted; // Any progress means show popup
  
  console.log(`📈 Progress check: question ${state.currentQuestion + 1}/${state.answers.length}, ${answeredCount} answered, timeElapsed: ${state.timeElapsed}s, hasProgress: ${hasProgress}`);
  return hasProgress;
}

export function isTestCompleted(): boolean {
  const state = loadTestState();
  if (!state) return false;
  
  // ✅ SMART: Check completion flag first, then answer count
  if (state.isCompleted) {
    console.log(`✅ Test marked as completed with flag`);
    return true;
  }
  
  const answeredCount = state.answers.filter(a => a !== null).length;
  const isCompleted = answeredCount === state.answers.length;
  
  console.log(`✅ Completion check: ${answeredCount}/${state.answers.length} answered, isCompleted: ${isCompleted}`);
  return isCompleted;
}

export function calculateRemainingTime(state: TestState): number {
  const totalElapsed = state.timeElapsed + Math.floor((Date.now() - state.startTime) / 1000);
  const remaining = state.totalTime - totalElapsed;
  return Math.max(0, remaining);
}

/**
 * Tính toán chính xác thời gian đã trôi qua dựa trên thời điểm lưu trạng thái cuối
 * và thời gian đã trôi qua được lưu trữ
 */
export function getAccurateTimeElapsed(): number {
  const state = loadTestState();
  if (!state) return 0;
  
  // Nếu test đã hoàn thành, trả về thời gian đã lưu
  if (state.isCompleted) {
    return state.timeElapsed;
  }
  
  // Nếu có timestamp của lần lưu cuối, tính thêm thời gian từ lúc đó đến hiện tại
  if (state.lastSavedAt) {
    const additionalTime = Math.floor((Date.now() - state.lastSavedAt) / 1000);
    const totalElapsed = state.timeElapsed + additionalTime;
    console.log(`⏱️ Accurate time calculation: ${state.timeElapsed}s saved + ${additionalTime}s additional = ${totalElapsed}s total`);
    return totalElapsed;
  }
  
  return state.timeElapsed;
} 