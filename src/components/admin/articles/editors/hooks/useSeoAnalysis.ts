/**
 * SEO ANALYSIS HOOK
 * Tách logic phân tích SEO để dễ quản lý và tái sử dụng
 */

import { useState, useEffect, useMemo } from 'react';
import type { FormData } from './useFormHandlers';

// SEO Check interface
export interface SeoCheck {
  name: string;
  status: 'good' | 'warning' | 'bad';
  message: string;
}

// SEO Analysis result interface
export interface SeoAnalysisResult {
  wordCount: number;
  readingTime: number;
  score: number;
  checks: SeoCheck[];
}

// Hook props
interface UseSeoAnalysisProps {
  formData: FormData;
  debounceMs?: number;
}

export const useSeoAnalysis = ({ 
  formData, 
  debounceMs = 500 
}: UseSeoAnalysisProps): SeoAnalysisResult => {

  // OPTIMIZED: SEO analysis với debouncing để tránh re-calculate liên tục
  const [debouncedFormData, setDebouncedFormData] = useState(formData);

  // Debounce formData changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormData(formData);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [formData.title, formData.content, formData.meta_description, formData.slug, formData.focus_keyword, debounceMs]);

  // SEO calculations chỉ chạy khi debouncedFormData thay đổi
  const seoAnalysis = useMemo((): SeoAnalysisResult => {
    const wordCount = debouncedFormData.content.split(' ').filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);

    // SEO Score calculation
    let score = 0;
    const checks: SeoCheck[] = [];

    // Title check
    const titleLength = debouncedFormData.title.length;
    if (titleLength >= 10 && titleLength <= 60) {
      score += 20;
      checks.push({ name: 'Tiêu đề', status: 'good', message: 'Độ dài tối ưu (10-60 ký tự)' });
    } else {
      checks.push({ name: 'Tiêu đề', status: 'bad', message: 'Nên từ 10-60 ký tự' });
    }

    // Content length check
    if (wordCount >= 300) {
      score += 15;
      checks.push({ name: 'Nội dung', status: 'good', message: `${wordCount} từ - Đủ dài` });
    } else {
      checks.push({ name: 'Nội dung', status: 'bad', message: `${wordCount} từ - Nên ít nhất 300 từ` });
    }

    // Meta description check
    const metaLength = debouncedFormData.meta_description.length;
    if (metaLength >= 120 && metaLength <= 160) {
      score += 20;
      checks.push({ name: 'Meta description', status: 'good', message: 'Độ dài tối ưu (120-160 ký tự)' });
    } else if (metaLength > 0) {
      checks.push({ name: 'Meta description', status: 'warning', message: `${metaLength} ký tự - Nên từ 120-160` });
    } else {
      checks.push({ name: 'Meta description', status: 'bad', message: 'Chưa có meta description' });
    }

    // Slug check
    if (debouncedFormData.slug.length > 0) {
      score += 15;
      checks.push({ name: 'URL slug', status: 'good', message: 'Có URL slug' });
    } else {
      checks.push({ name: 'URL slug', status: 'bad', message: 'Cần có URL slug' });
    }

    // Focus keyword check
    if (debouncedFormData.focus_keyword) {
      const keyword = debouncedFormData.focus_keyword.toLowerCase();
      const titleHasKeyword = debouncedFormData.title.toLowerCase().includes(keyword);
      const contentHasKeyword = debouncedFormData.content.toLowerCase().includes(keyword);

      if (titleHasKeyword && contentHasKeyword) {
        score += 20;
        checks.push({ name: 'Từ khóa', status: 'good', message: 'Xuất hiện trong title và content' });
      } else if (titleHasKeyword || contentHasKeyword) {
        score += 10;
        checks.push({ name: 'Từ khóa', status: 'warning', message: 'Cần xuất hiện trong cả title và content' });
      } else {
        checks.push({ name: 'Từ khóa', status: 'bad', message: 'Từ khóa không xuất hiện' });
      }
    } else {
      checks.push({ name: 'Từ khóa', status: 'bad', message: 'Chưa có từ khóa chính' });
    }
    
    return { wordCount, readingTime, score, checks };
  }, [debouncedFormData]);

  return seoAnalysis;
};

// Helper functions for SEO score styling
export const getSeoScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const getSeoScoreGradient = (score: number) => {
  if (score >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-500';
  if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-orange-500';
  return 'bg-gradient-to-r from-red-500 to-pink-500';
};

export const getSeoScoreBadge = (score: number) => {
  if (score >= 80) return {
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    text: 'Xuất sắc'
  };
  if (score >= 60) return {
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    text: 'Tốt'
  };
  return {
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    text: 'Cần cải thiện'
  };
};

export const getSeoCheckColor = (status: SeoCheck['status']) => {
  switch (status) {
    case 'good':
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    case 'warning':
      return 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 'bad':
      return 'bg-gradient-to-r from-red-500 to-pink-500';
    default:
      return 'bg-gray-400';
  }
};
