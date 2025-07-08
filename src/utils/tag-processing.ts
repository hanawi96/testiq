/**
 * Utility functions for bulk tag processing
 * Tái sử dụng logic từ ArticleEditor cho QuickTagsEditor và các component khác
 */

export interface BulkTagProcessingResult {
  validTags: string[];
  duplicates: string[];
  tooLong: string[];
  empty: number;
}

export interface TagProcessingOptions {
  maxLength?: number;
  caseSensitive?: boolean;
  normalizeFunction?: (tag: string) => string;
  separator?: string;
}

/**
 * Normalize tag function - có thể customize cho từng use case
 */
export const defaultNormalizeTag = (tag: string): string => {
  const trimmed = tag.trim();

  // Special cases for common tech tags (keep uppercase)
  const upperCaseTags = [
    'SEO', 'API', 'UI', 'UX', 'CSS', 'HTML', 'SQL', 'JSON', 'XML', 
    'HTTP', 'HTTPS', 'REST', 'GraphQL', 'JWT', 'OAuth', 'AI', 'ML', 
    'IoT', 'VR', 'AR', 'PHP', 'JS', 'TS', 'AWS', 'GCP', 'CDN'
  ];
  
  const upperTag = trimmed.toUpperCase();
  if (upperCaseTags.includes(upperTag)) {
    return upperTag;
  }

  // For other tags, capitalize first letter
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Simple lowercase normalize function (cho ArticleEditor)
 */
export const lowercaseNormalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
};

/**
 * Core function để xử lý bulk tag input
 */
export function processBulkTags(
  input: string,
  existingTags: string[] = [],
  options: TagProcessingOptions = {}
): BulkTagProcessingResult {
  const {
    maxLength = 50,
    caseSensitive = false,
    normalizeFunction = lowercaseNormalizeTag,
    separator = ','
  } = options;

  // Tách tags bằng separator
  const rawTags = input.split(separator);
  const validTags: string[] = [];
  const duplicates: string[] = [];
  const tooLong: string[] = [];
  let emptyCount = 0;

  // Chuẩn bị existing tags để so sánh
  const existingTagsForComparison = caseSensitive 
    ? existingTags 
    : existingTags.map(tag => tag.toLowerCase());

  rawTags.forEach(tag => {
    // Trim whitespace
    const trimmedTag = tag.trim();
    
    // Bỏ qua tag trống hoặc chỉ chứa khoảng trắng
    if (!trimmedTag) {
      emptyCount++;
      return;
    }
    
    // Kiểm tra độ dài tag
    if (trimmedTag.length > maxLength) {
      tooLong.push(trimmedTag);
      return;
    }
    
    // Normalize tag
    const normalizedTag = normalizeFunction(trimmedTag);
    
    // Chuẩn bị tag để so sánh duplicate
    const tagForComparison = caseSensitive ? normalizedTag : normalizedTag.toLowerCase();
    
    // Kiểm tra duplicate trong existing tags
    if (existingTagsForComparison.includes(tagForComparison)) {
      duplicates.push(normalizedTag);
      return;
    }
    
    // Kiểm tra duplicate trong batch hiện tại
    const validTagsForComparison = caseSensitive 
      ? validTags 
      : validTags.map(t => t.toLowerCase());
      
    if (validTagsForComparison.includes(tagForComparison)) {
      return; // Bỏ qua duplicate trong batch
    }
    
    validTags.push(normalizedTag);
  });
  
  return { validTags, duplicates, tooLong, empty: emptyCount };
}

/**
 * Helper function để tạo feedback message
 */
export function createTagFeedbackMessage(result: BulkTagProcessingResult): {
  message: string;
  type: 'success' | 'warning' | 'error';
} {
  const { validTags, duplicates, tooLong, empty } = result;
  
  let messages: string[] = [];
  let type: 'success' | 'warning' | 'error' = 'success';
  
  // Success message
  if (validTags.length > 0) {
    messages.push(`✅ Đã thêm ${validTags.length} tag: ${validTags.join(', ')}`);
  }
  
  // Warning messages
  if (duplicates.length > 0) {
    messages.push(`⚠️ Tag đã tồn tại: ${duplicates.join(', ')}`);
    type = 'warning';
  }
  
  if (tooLong.length > 0) {
    const truncatedTags = tooLong.map(tag => 
      tag.length > 20 ? tag.substring(0, 20) + '...' : tag
    );
    messages.push(`❌ Tag quá dài (>${50} ký tự): ${truncatedTags.join(', ')}`);
    type = 'warning';
  }
  
  if (empty > 0) {
    messages.push(`ℹ️ Đã bỏ qua ${empty} tag trống`);
  }
  
  // No valid tags and has issues
  if (validTags.length === 0 && (duplicates.length > 0 || tooLong.length > 0)) {
    type = 'error';
  }
  
  return {
    message: messages.join('\n'),
    type
  };
}

/**
 * Validate single tag
 */
export function validateSingleTag(
  tag: string,
  existingTags: string[] = [],
  options: TagProcessingOptions = {}
): {
  isValid: boolean;
  normalizedTag?: string;
  error?: string;
} {
  const {
    maxLength = 50,
    caseSensitive = false,
    normalizeFunction = lowercaseNormalizeTag
  } = options;

  const trimmedTag = tag.trim();
  
  if (!trimmedTag) {
    return { isValid: false, error: 'Tag không được để trống' };
  }
  
  if (trimmedTag.length > maxLength) {
    return { isValid: false, error: `Tag quá dài (tối đa ${maxLength} ký tự)` };
  }
  
  const normalizedTag = normalizeFunction(trimmedTag);
  const existingTagsForComparison = caseSensitive 
    ? existingTags 
    : existingTags.map(t => t.toLowerCase());
  const tagForComparison = caseSensitive ? normalizedTag : normalizedTag.toLowerCase();
  
  if (existingTagsForComparison.includes(tagForComparison)) {
    return { isValid: false, error: 'Tag đã tồn tại' };
  }
  
  return { isValid: true, normalizedTag };
}

/**
 * Extract tags from text content (bonus utility)
 */
export function extractTagsFromContent(content: string, maxTags: number = 10): string[] {
  // Simple keyword extraction - có thể improve sau
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && word.length < 20);
  
  // Count frequency
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top tags
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxTags)
    .map(([word]) => word);
}

/**
 * Format tags for display
 */
export function formatTagsForDisplay(tags: string[], maxDisplay: number = 5): {
  displayTags: string[];
  hiddenCount: number;
} {
  if (tags.length <= maxDisplay) {
    return { displayTags: tags, hiddenCount: 0 };
  }
  
  return {
    displayTags: tags.slice(0, maxDisplay),
    hiddenCount: tags.length - maxDisplay
  };
}

/**
 * Export all functions for easy import
 */
export default {
  processBulkTags,
  createTagFeedbackMessage,
  validateSingleTag,
  extractTagsFromContent,
  formatTagsForDisplay,
  defaultNormalizeTag,
  lowercaseNormalizeTag
};
