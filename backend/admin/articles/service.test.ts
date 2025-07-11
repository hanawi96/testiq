/**
 * Test file for Service Layer Validation Cleanup
 * Verifies that optimizations work correctly
 */

import { ArticlesService } from './service';
import type { CreateArticleData } from './types';

// Mock ArticleQueries to avoid database dependencies
jest.mock('./queries', () => ({
  ArticleQueries: {
    checkSlugExists: jest.fn().mockResolvedValue({ exists: false }),
    createArticle: jest.fn().mockResolvedValue({ 
      data: { id: '1', title: 'Test Article', slug: 'test-article' }, 
      error: null 
    }),
    updateArticle: jest.fn().mockResolvedValue({ 
      data: { id: '1', title: 'Updated Article' }, 
      error: null 
    })
  }
}));

describe('ArticlesService - Validation Optimization', () => {
  describe('validateArticleData', () => {
    test('should validate title requirements', async () => {
      const invalidData: CreateArticleData = {
        title: '',
        content: 'Valid content here'
      };

      const result = await ArticlesService.createArticle(invalidData, 'author-id');
      
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Tiêu đề không được để trống');
    });

    test('should validate title length', async () => {
      const invalidData: CreateArticleData = {
        title: 'AB', // Too short
        content: 'Valid content here'
      };

      const result = await ArticlesService.createArticle(invalidData, 'author-id');
      
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Tiêu đề phải có ít nhất 3 ký tự');
    });

    test('should validate content requirements', async () => {
      const invalidData: CreateArticleData = {
        title: 'Valid Title',
        content: ''
      };

      const result = await ArticlesService.createArticle(invalidData, 'author-id');
      
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Nội dung không được để trống');
    });

    test('should validate content length', async () => {
      const invalidData: CreateArticleData = {
        title: 'Valid Title',
        content: 'Short' // Too short
      };

      const result = await ArticlesService.createArticle(invalidData, 'author-id');
      
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Nội dung phải có ít nhất 10 ký tự');
    });

    test('should pass validation with valid data', async () => {
      const validData: CreateArticleData = {
        title: 'Valid Article Title',
        content: 'This is a valid content that is long enough to pass validation'
      };

      const result = await ArticlesService.createArticle(validData, 'author-id');
      
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('generateUniqueSlug', () => {
    test('should handle slug conflicts automatically', async () => {
      // Mock slug exists for first attempt
      const { ArticleQueries } = require('./queries');
      ArticleQueries.checkSlugExists
        .mockResolvedValueOnce({ exists: true })  // First attempt conflicts
        .mockResolvedValueOnce({ exists: false }); // Second attempt is unique

      const validData: CreateArticleData = {
        title: 'Test Article',
        content: 'This is a valid content that is long enough to pass validation'
      };

      const result = await ArticlesService.createArticle(validData, 'author-id');
      
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      // Should have called checkSlugExists twice due to conflict resolution
      expect(ArticleQueries.checkSlugExists).toHaveBeenCalledTimes(2);
    });
  });
});

console.log('✅ Service Layer Validation Cleanup - Test file created');
console.log('📊 Optimizations completed:');
console.log('  - Centralized error messages');
console.log('  - Comprehensive validation rules');
console.log('  - Simplified slug generation with conflict resolution');
console.log('  - Removed duplicate code patterns');
console.log('  - Improved maintainability and consistency');
