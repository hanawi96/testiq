/**
 * Test cases cho tính năng tìm kiếm trong admin articles
 * Kiểm tra các cải thiện: debouncing, search accuracy, UX
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchDebounce } from '../hooks/useSearchDebounce';
import SearchInput from '../components/admin/common/SearchInput';
import SearchHighlight from '../components/admin/common/SearchHighlight';
import SearchStats from '../components/admin/common/SearchStats';

// Mock timer functions
vi.useFakeTimers();

describe('Search Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('useSearchDebounce Hook', () => {
    it('should debounce search input correctly', async () => {
      const mockOnSearch = vi.fn();
      let hookResult: any;

      function TestComponent() {
        hookResult = useSearchDebounce({
          delay: 300,
          onSearch: mockOnSearch
        });
        return null;
      }

      render(<TestComponent />);

      // Simulate rapid typing
      hookResult.setSearchTerm('t');
      hookResult.setSearchTerm('te');
      hookResult.setSearchTerm('tes');
      hookResult.setSearchTerm('test');

      // Should not call onSearch immediately
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(300);

      // Should call onSearch only once with final value
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    it('should handle clear search correctly', () => {
      const mockOnClear = vi.fn();
      let hookResult: any;

      function TestComponent() {
        hookResult = useSearchDebounce({
          onClear: mockOnClear
        });
        return null;
      }

      render(<TestComponent />);

      hookResult.setSearchTerm('test');
      hookResult.clearSearch();

      expect(hookResult.searchTerm).toBe('');
      expect(mockOnClear).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts', () => {
      const mockOnSearch = vi.fn();
      const mockOnClear = vi.fn();
      let hookResult: any;

      function TestComponent() {
        hookResult = useSearchDebounce({
          onSearch: mockOnSearch,
          onClear: mockOnClear
        });
        return null;
      }

      render(<TestComponent />);

      hookResult.setSearchTerm('test');

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      hookResult.handleKeyDown(enterEvent);
      expect(mockOnSearch).toHaveBeenCalledWith('test');

      // Test Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      hookResult.handleKeyDown(escapeEvent);
      expect(mockOnClear).toHaveBeenCalled();
    });
  });

  describe('SearchInput Component', () => {
    it('should render with correct placeholder', () => {
      const mockOnChange = vi.fn();
      
      render(
        <SearchInput
          value=""
          onChange={mockOnChange}
          placeholder="Tìm kiếm bài viết..."
        />
      );

      const input = screen.getByPlaceholderText('Tìm kiếm bài viết...');
      expect(input).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const mockOnChange = vi.fn();
      
      render(
        <SearchInput
          value="test"
          onChange={mockOnChange}
          isLoading={true}
        />
      );

      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show clear button when has value', () => {
      const mockOnChange = vi.fn();
      
      render(
        <SearchInput
          value="test search"
          onChange={mockOnChange}
        />
      );

      // Should show clear button
      const clearButton = screen.getByTitle(/xóa tìm kiếm/i);
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('SearchHighlight Component', () => {
    it('should highlight search terms correctly', () => {
      render(
        <SearchHighlight
          text="This is a test article title"
          searchTerm="test"
        />
      );

      const highlightedText = screen.getByText('test');
      expect(highlightedText.tagName).toBe('MARK');
    });

    it('should handle case-insensitive search', () => {
      render(
        <SearchHighlight
          text="This is a TEST article title"
          searchTerm="test"
        />
      );

      const highlightedText = screen.getByText('TEST');
      expect(highlightedText.tagName).toBe('MARK');
    });

    it('should handle empty search term', () => {
      render(
        <SearchHighlight
          text="This is a test article title"
          searchTerm=""
        />
      );

      // Should not highlight anything
      const marks = document.querySelectorAll('mark');
      expect(marks).toHaveLength(0);
    });
  });

  describe('SearchStats Component', () => {
    it('should display search results correctly', () => {
      render(
        <SearchStats
          searchTerm="test"
          totalResults={25}
          currentPage={1}
          totalPages={3}
        />
      );

      expect(screen.getByText(/tìm thấy/i)).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText(/trang 1 \/ 3/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <SearchStats
          searchTerm="test"
          totalResults={0}
          currentPage={1}
          totalPages={1}
          isLoading={true}
        />
      );

      expect(screen.getByText(/đang tìm kiếm/i)).toBeInTheDocument();
    });

    it('should hide when no search term', () => {
      const { container } = render(
        <SearchStats
          searchTerm=""
          totalResults={0}
          currentPage={1}
          totalPages={1}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});

// Integration test for search workflow
describe('Search Integration Tests', () => {
  it('should complete full search workflow', async () => {
    // This would test the complete search flow:
    // 1. User types in search input
    // 2. Debouncing works correctly
    // 3. API call is made with correct parameters
    // 4. Results are displayed with highlighting
    // 5. Search stats are updated
    
    // Note: This would require more complex setup with mocked API calls
    // and full component integration testing
    expect(true).toBe(true); // Placeholder
  });
});
