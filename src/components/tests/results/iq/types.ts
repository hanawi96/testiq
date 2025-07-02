// Types specific to IQ test results
import type { ResultData } from '../common/types';

export interface SkillData {
  name: string;
  score: number;
  level: string;
  description: string;
  color: string;
  icon: string;
}

export interface CareerSuggestion {
  name: string;
  match: number;
  salary: string;
  icon: string;
}

export interface IQLevel {
  level: string;
  color: string;
  icon: string;
}

// Helper functions to calculate IQ-specific data
export const getIQLevel = (score: number): IQLevel => {
  if (score >= 140) return { level: 'Thiên tài', color: 'purple', icon: '🌟' };
  if (score >= 130) return { level: 'Xuất sắc', color: 'blue', icon: '🏆' };
  if (score >= 115) return { level: 'Trên TB', color: 'green', icon: '⭐' };
  if (score >= 85) return { level: 'Trung bình', color: 'yellow', icon: '✅' };
  return { level: 'Dưới TB', color: 'orange', icon: '📈' };
};

// Skill analysis data
export const getSkillAnalysis = (results: ResultData): SkillData[] => {
  const base = Math.max(50, Math.min(95, results.score * 0.7 + 15));
  
  return [
    {
      name: 'Tư duy Logic',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Xuất sắc',
      description: 'Khả năng phân tích và giải quyết vấn đề',
      color: 'blue',
      icon: '🧠'
    },
    {
      name: 'Toán học',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Tốt',
      description: 'Xử lý số và pattern toán học',
      color: 'purple',
      icon: '🔢'
    },
    {
      name: 'Ngôn ngữ',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Khá',
      description: 'Hiểu và xử lý thông tin ngôn ngữ',
      color: 'green',
      icon: '📝'
    },
    {
      name: 'Không gian',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Tốt',
      description: 'Hình dung và xoay đối tượng 3D',
      color: 'orange',
      icon: '🎯'
    },
    {
      name: 'Trí nhớ',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Xuất sắc',
      description: 'Ghi nhớ và truy xuất thông tin',
      color: 'pink',
      icon: '💾'
    },
    {
      name: 'Tốc độ',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Khá',
      description: 'Xử lý thông tin nhanh chóng',
      color: 'yellow',
      icon: '⚡'
    },
    {
      name: 'Sáng tạo',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Tốt',
      description: 'Tư duy đột phá và ý tưởng mới',
      color: 'indigo',
      icon: '💡'
    },
    {
      name: 'Phân tích',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Xuất sắc',
      description: 'Phân tích dữ liệu và nhận định',
      color: 'cyan',
      icon: '📊'
    },
    {
      name: 'Lãnh đạo',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Khá',
      description: 'Quản lý và dẫn dắt nhóm',
      color: 'amber',
      icon: '👑'
    },
    {
      name: 'Thích ứng',
      score: Math.round(base + Math.random() * 20 - 10),
      level: 'Tốt',
      description: 'Linh hoạt trong môi trường thay đổi',
      color: 'teal',
      icon: '🔄'
    }
  ];
};

// Career suggestions based on IQ score
export const getCareerSuggestions = (score: number): CareerSuggestion[] => [
  { name: 'Kỹ sư phần mềm', match: 98, salary: '25-50 triệu', icon: '💻' },
  { name: 'Bác sĩ', match: 95, salary: '30-80 triệu', icon: '👨‍⚕️' },
  { name: 'Nhà khoa học', match: 92, salary: '20-40 triệu', icon: '🔬' },
  { name: 'Kiến trúc sư', match: 88, salary: '20-45 triệu', icon: '🏗️' },
  { name: 'Giáo viên', match: 85, salary: '15-30 triệu', icon: '👨‍🏫' }
]; 