import type { Question } from '../utils/test';
import demoQuestionsData from './questions/vi/iq-demo-60.json';

// Convert JSON structure to Question[] format
function convertJSONToQuestions(data: any): Question[] {
  return data.questions.map((q: any) => ({
    id: q.id,
    type: q.type || 'logic',
    difficulty: q.difficulty,
    question: q.question,
    options: q.options.map((opt: any) => opt.text),
    correct: q.options.findIndex((opt: any) => opt.id === q.correct),
    explanation: q.explanation
  }));
}

export const iqQuestions: Question[] = convertJSONToQuestions(demoQuestionsData);

export const testConfig = {
  timeLimit: 1500, // 25 phút = 1500 giây (cho 60 câu)
  title: 'Demo Test IQ 60 Câu',
  description: 'Test navigation với 60 câu hỏi IQ đầy đủ để kiểm tra smart navigation'
}; 