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
  
  // Check if test has meaningful progress (answered at least one question)
  const answeredCount = state.answers.filter(a => a !== null).length;
  const hasProgress = answeredCount > 0 && answeredCount < state.answers.length;
  
  console.log(`📈 Progress check: ${answeredCount}/${state.answers.length} answered, hasProgress: ${hasProgress}`);
  return hasProgress;
}

export function calculateRemainingTime(state: TestState): number {
  const totalElapsed = state.timeElapsed + Math.floor((Date.now() - state.startTime) / 1000);
  const remaining = state.totalTime - totalElapsed;
  return Math.max(0, remaining);
} 