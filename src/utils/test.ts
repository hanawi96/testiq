export interface Question {
    id: number;
    type: 'logic' | 'math' | 'verbal' | 'spatial' | 'pattern';
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }
  
  export interface TestData {
    testInfo: {
      title: string;
      description: string;
      timeLimit: number;
      totalQuestions: number;
    };
    questions: Question[];
  }
  
  export interface UserInfo {
    name: string;
    age: string;
    location: string;
  }
  
  export interface TestResult {
    score: number;
    iq: number;
    classification: string;
    percentile: number;
    answers: number[];
    timeSpent: number;
    categoryScores: Record<string, number>;
    detailed: {
      correct: number;
      incorrect: number;
      accuracy: number;
    };
    userInfo?: UserInfo;
    timestamp?: number;
  }
  
  export function calculateIQ(score: number, totalQuestions: number): number {
    const percentage = (score / totalQuestions) * 100;
    
    // IQ calculation based on standard distribution
    // Mean = 100, Standard deviation = 15
    if (percentage >= 95) return 145;
    if (percentage >= 90) return 130;
    if (percentage >= 85) return 120;
    if (percentage >= 75) return 115;
    if (percentage >= 65) return 110;
    if (percentage >= 50) return 100;
    if (percentage >= 35) return 90;
    if (percentage >= 25) return 85;
    if (percentage >= 15) return 80;
    if (percentage >= 10) return 75;
    return 70;
  }
  
  export function getIQClassification(iq: number): string {
    if (iq >= 145) return 'genius';
    if (iq >= 130) return 'very_superior';
    if (iq >= 120) return 'superior';
    if (iq >= 110) return 'high_average';
    if (iq >= 90) return 'average';
    if (iq >= 80) return 'low_average';
    if (iq >= 70) return 'borderline';
    return 'low';
  }
  
  export function calculatePercentile(iq: number): number {
    // Approximate percentile based on normal distribution
    if (iq >= 145) return 99.9;
    if (iq >= 130) return 98;
    if (iq >= 120) return 91;
    if (iq >= 110) return 75;
    if (iq >= 100) return 50;
    if (iq >= 90) return 25;
    if (iq >= 80) return 9;
    if (iq >= 70) return 2;
    return 0.1;
  }
  
  export function calculateCategoryScores(questions: Question[], answers: number[]): Record<string, number> {
    const categories: Record<string, { correct: number; total: number }> = {};
    
    questions.forEach((question, index) => {
      if (!categories[question.type]) {
        categories[question.type] = { correct: 0, total: 0 };
      }
      
      categories[question.type].total++;
      if (answers[index] === question.correct) {
        categories[question.type].correct++;
      }
    });
    
    const scores: Record<string, number> = {};
    Object.entries(categories).forEach(([type, data]) => {
      scores[type] = Math.round((data.correct / data.total) * 100);
    });
    
    return scores;
  }
  
  export function generateTestResult(
    questions: Question[],
    answers: number[],
    timeSpent: number
  ): TestResult {
    const correctAnswers = answers.filter((answer, index) => 
      answer === questions[index].correct
    ).length;
    
    const iq = calculateIQ(correctAnswers, questions.length);
    const classification = getIQClassification(iq);
    const percentile = calculatePercentile(iq);
    const categoryScores = calculateCategoryScores(questions, answers);
    
    return {
      score: correctAnswers,
      iq,
      classification,
      percentile,
      answers,
      timeSpent,
      categoryScores,
      detailed: {
        correct: correctAnswers,
        incorrect: questions.length - correctAnswers,
        accuracy: Math.round((correctAnswers / questions.length) * 100)
      }
    };
  }
  
  export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  export async function saveTestResult(result: TestResult): Promise<void> {
    // Save to localStorage as backup
    try {
      const results = getTestHistory();
      const resultWithTimestamp = {
        ...result,
        timestamp: Date.now()
      };
      results.push(resultWithTimestamp);
      localStorage.setItem('iq-test-history', JSON.stringify(results));
      
      // Save current result for redirect to result page
      localStorage.setItem('current-test-result', JSON.stringify(resultWithTimestamp));
      console.log('💾 Test result saved to history and localStorage');
    } catch (error) {
      console.warn('Cannot save test result to localStorage:', error);
    }

    // Save to Supabase
    try {
      // Dynamic import to avoid build issues
      const { saveTestResult: saveToSupabase, AuthService } = await import('../../backend');
      
      // Check if user is authenticated
      const { user } = await AuthService.getCurrentUser();
      
      let testData;
      
      if (user) {
        // Authenticated user - save with user_id
        console.log('💾 Saving test result for authenticated user:', user.id);
        testData = {
          user_id: user.id,
          test_type: 'iq',
          score: result.iq, // Use IQ score as the main score
          accuracy: result.detailed.accuracy,
          duration_seconds: result.timeSpent,
          test_data: {
            score: result.score,
            iq: result.iq,
            classification: result.classification,
            percentile: result.percentile,
            answers: result.answers,
            categoryScores: result.categoryScores,
            detailed: result.detailed
          }
          // guest_* fields are null for authenticated users
        };
      } else {
        // Anonymous user - save with guest info if provided
        if (!result.userInfo) {
          console.log('⚠️ No user info provided for anonymous test, skipping Supabase save');
          return;
        }
        
        console.log('💾 Saving test result for anonymous user');
        testData = {
          user_id: null, // Anonymous user
          test_type: 'iq',
          score: result.iq, // Use IQ score as the main score
          accuracy: result.detailed.accuracy,
          duration_seconds: result.timeSpent,
          test_data: {
            score: result.score,
            iq: result.iq,
            classification: result.classification,
            percentile: result.percentile,
            answers: result.answers,
            categoryScores: result.categoryScores,
            detailed: result.detailed
          },
          guest_name: result.userInfo.name,
          guest_age: parseInt(result.userInfo.age) || null,
          guest_location: result.userInfo.location
        };
      }

      const saveResult = await saveToSupabase(testData);
      
      if (saveResult.success) {
        console.log('✅ Test result saved to Supabase successfully');
      } else {
        console.error('❌ Failed to save to Supabase:', saveResult.error);
      }
    } catch (error) {
      console.error('❌ Error saving to Supabase:', error);
    }
  }
  
  export function getTestHistory(): TestResult[] {
    try {
      const history = localStorage.getItem('iq-test-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Cannot load test history:', error);
      return [];
    }
  }

  // Anonymous user localStorage management
  export function saveAnonymousUserInfo(userInfo: UserInfo): void {
    try {
      localStorage.setItem('anonymous-user-info', JSON.stringify(userInfo));
      console.log('💾 Anonymous user info saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Cannot save anonymous user info:', error);
    }
  }

  export function getAnonymousUserInfo(): UserInfo | null {
    try {
      const saved = localStorage.getItem('anonymous-user-info');
      if (saved) {
        const userInfo = JSON.parse(saved);
        console.log('📱 Retrieved anonymous user info from localStorage');
        return userInfo;
      }
    } catch (error) {
      console.warn('⚠️ Cannot load anonymous user info:', error);
    }
    return null;
  }

  export function clearAnonymousUserInfo(): void {
    try {
      localStorage.removeItem('anonymous-user-info');
      console.log('🗑️ Anonymous user info cleared from localStorage');
    } catch (error) {
      console.warn('⚠️ Cannot clear anonymous user info:', error);
    }
  }

  // Get real user test history - Smart source selection
  export async function getUserRealTestHistory(): Promise<TestResult[]> {
    try {
      const { AuthService, getUserTestResults } = await import('../../backend');
      const { user } = await AuthService.getCurrentUser();
      
      if (user) {
        // Authenticated user → Database only
        console.log('🔐 Authenticated user → Fetching from Database');
        const supabaseResults = await getUserTestResults({ 
          user_id: user.id, 
          test_type: 'iq',
          limit: 100
        });
        
        if (supabaseResults.success && supabaseResults.data) {
          const results = supabaseResults.data.map((item: any) => ({
            score: item.test_data?.score || 0,
            iq: item.score,
            classification: item.test_data?.classification || 'average',
            percentile: item.test_data?.percentile || 50,
            answers: item.test_data?.answers || [],
            timeSpent: item.duration_seconds || 0,
            duration_seconds: item.duration_seconds || 0,
            categoryScores: item.test_data?.categoryScores || {},
            detailed: item.test_data?.detailed || { correct: 0, incorrect: 0, accuracy: 0 },
            timestamp: new Date(item.tested_at).getTime()
          }));
          
          console.log('✅ Database:', results.length, 'tests loaded');
          return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        return [];
      } else {
        // Anonymous user → LocalStorage only
        console.log('👤 Anonymous user → Fetching from LocalStorage');
        const localResults = getTestHistory();
        console.log('✅ LocalStorage:', localResults.length, 'tests loaded');
        return localResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      
    } catch (error) {
      console.warn('⚠️ Error loading test history, fallback to localStorage');
      return getTestHistory().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  }