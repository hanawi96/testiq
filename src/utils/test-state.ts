interface TestState {
  currentQuestion: number;
  answers: (number | null)[];
  timeElapsed: number; // seconds elapsed
  startTime: number; // timestamp when test started
  totalTime: number; // total time limit in seconds
}

const TEST_STATE_KEY = 'iq_test_state';

export function saveTestState(state: TestState): void {
  try {
    localStorage.setItem(TEST_STATE_KEY, JSON.stringify(state));
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