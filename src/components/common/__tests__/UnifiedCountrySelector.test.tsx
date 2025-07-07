import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnifiedCountrySelector, { type Country } from '../UnifiedCountrySelector';

// Mock the backend import
jest.mock('@/backend', () => ({
  getCountriesWithVietnamFirst: jest.fn(() => 
    Promise.resolve({
      data: [
        { id: 'VN', name: 'Việt Nam', code: 'VN' },
        { id: 'US', name: 'United States', code: 'US' },
        { id: 'SG', name: 'Singapore', code: 'SG' }
      ]
    })
  )
}));

// Mock fetch for JSON fallback
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([
      { name: 'Việt Nam', code: 'VN', emoji: '🇻🇳' },
      { name: 'United States', code: 'US', emoji: '🇺🇸' }
    ])
  })
) as jest.Mock;

describe('UnifiedCountrySelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder when no value is provided', async () => {
    render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
        placeholder="Select country"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select country')).toBeInTheDocument();
    });
  });

  it('loads and displays countries from database', async () => {
    render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
      />
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Việt Nam')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('Singapore')).toBeInTheDocument();
    });
  });

  it('calls onChange with correct parameters when country is selected', async () => {
    render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Việt Nam')).toBeInTheDocument();
    });

    // Select Vietnam
    fireEvent.click(screen.getByText('Việt Nam'));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'VN',
        name: 'Việt Nam',
        code: 'VN'
      }),
      'Việt Nam',
      'VN'
    );
  });

  it('filters countries based on search input', async () => {
    render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Việt Nam')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Tìm kiếm quốc gia...');
    fireEvent.change(searchInput, { target: { value: 'United' } });

    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.queryByText('Việt Nam')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Việt Nam')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm kiếm quốc gia...');

    // Navigate down
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    // Select with Enter
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('displays selected country correctly', async () => {
    render(
      <UnifiedCountrySelector
        value="Việt Nam"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Việt Nam')).toBeInTheDocument();
    });
  });

  it('shows flag when showFlag is true', async () => {
    render(
      <UnifiedCountrySelector
        value="Việt Nam"
        onChange={mockOnChange}
        showFlag={true}
      />
    );

    await waitFor(() => {
      const flagImg = screen.getByAltText('Việt Nam flag');
      expect(flagImg).toBeInTheDocument();
    });
  });

  it('applies correct variant styling', () => {
    const { rerender } = render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
        variant="popup"
      />
    );

    let container = screen.getByRole('button').parentElement;
    expect(container).toHaveClass('relative');

    rerender(
      <UnifiedCountrySelector
        onChange={mockOnChange}
        variant="admin"
      />
    );

    container = screen.getByRole('button').parentElement;
    expect(container).toHaveClass('relative');
  });

  it('handles disabled state correctly', () => {
    render(
      <UnifiedCountrySelector
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('clears selection when clear button is clicked', async () => {
    render(
      <UnifiedCountrySelector
        value="Việt Nam"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Việt Nam')).toBeInTheDocument();
    });

    // Find and click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null, '', '');
  });
});
