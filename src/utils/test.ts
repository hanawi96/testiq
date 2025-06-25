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
  
  export function saveTestResult(result: TestResult): void {
    try {
      const results = getTestHistory();
      const resultWithTimestamp = {
        ...result,
        timestamp: Date.now()
      };
      results.push(resultWithTimestamp);
      localStorage.setItem('iq-test-history', JSON.stringify(results));
    } catch (error) {
      console.warn('Cannot save test result:', error);
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