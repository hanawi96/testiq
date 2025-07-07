import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Unified Country interface that supports all use cases
export interface Country {
  id: string;
  name: string;
  code: string;
  emoji?: string;
  flag?: string;
}

// Flexible onChange callback that supports both patterns
export interface CountrySelectorProps {
  value?: string; // Country name or code
  onChange: (country: Country | null, countryName?: string, countryCode?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showFlag?: boolean;
  showCode?: boolean;
  variant?: 'popup' | 'admin'; // Determines styling and behavior
}

// Smart cache for countries (shared across all instances)
let countryCache: Country[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Fallback countries for offline/error scenarios
const FALLBACK_COUNTRIES: Country[] = [
  { id: 'VN', name: 'Việt Nam', code: 'VN', emoji: '🇻🇳' },
  { id: 'US', name: 'United States', code: 'US', emoji: '🇺🇸' },
  { id: 'SG', name: 'Singapore', code: 'SG', emoji: '🇸🇬' },
  { id: 'CA', name: 'Canada', code: 'CA', emoji: '🇨🇦' },
  { id: 'AU', name: 'Australia', code: 'AU', emoji: '🇦🇺' },
  { id: 'GB', name: 'United Kingdom', code: 'GB', emoji: '🇬🇧' },
  { id: 'DE', name: 'Germany', code: 'DE', emoji: '🇩🇪' },
  { id: 'FR', name: 'France', code: 'FR', emoji: '🇫🇷' },
  { id: 'JP', name: 'Japan', code: 'JP', emoji: '🇯🇵' },
  { id: 'KR', name: 'South Korea', code: 'KR', emoji: '🇰🇷' }
];

export default function UnifiedCountrySelector({
  value = '',
  onChange,
  placeholder = 'Chọn quốc gia',
  disabled = false,
  className = '',
  showFlag = true,
  showCode = false,
  variant = 'popup'
}: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart country loading with multiple fallbacks
  const loadCountries = useCallback(async (): Promise<Country[]> => {
    // Return cached data if valid
    const now = Date.now();
    if (countryCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return countryCache;
    }

    try {
      // Try database first (preferred for consistency)
      const backend = await import('@/backend');
      const result = await backend.getCountriesWithVietnamFirst();
      
      if (result.data && result.data.length > 0) {
        const dbCountries: Country[] = result.data.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          flag: `https://country-code-au6g.vercel.app/${c.code}.svg`
        }));
        
        // Cache the result
        countryCache = dbCountries;
        cacheTimestamp = now;
        return dbCountries;
      }
    } catch (dbError) {
      console.warn('Database countries failed, trying JSON fallback:', dbError);
    }

    try {
      // Fallback to JSON file
      const response = await fetch('/country.json');
      const jsonCountries = await response.json();
      
      if (Array.isArray(jsonCountries) && jsonCountries.length > 0) {
        const processedCountries: Country[] = jsonCountries.map(c => ({
          id: c.code || c.name,
          name: c.name,
          code: c.code,
          emoji: c.emoji,
          flag: `https://country-code-au6g.vercel.app/${c.code}.svg`
        }));
        
        // Move Vietnam to first position
        const vietnamIndex = processedCountries.findIndex(c => 
          c.code === 'VN' || c.name.toLowerCase().includes('việt nam')
        );
        if (vietnamIndex > 0) {
          const vietnam = processedCountries.splice(vietnamIndex, 1)[0];
          processedCountries.unshift(vietnam);
        }
        
        countryCache = processedCountries;
        cacheTimestamp = now;
        return processedCountries;
      }
    } catch (jsonError) {
      console.warn('JSON countries failed, using hardcoded fallback:', jsonError);
    }

    // Final fallback to hardcoded list
    return FALLBACK_COUNTRIES;
  }, []);

  // Initialize countries on mount
  useEffect(() => {
    const initCountries = async () => {
      try {
        const loadedCountries = await loadCountries();
        setCountries(loadedCountries);
        
        // Find and set selected country if value provided
        if (value) {
          const found = loadedCountries.find(c => 
            c.name.toLowerCase() === value.toLowerCase() ||
            c.code.toLowerCase() === value.toLowerCase()
          );
          setSelectedCountry(found || null);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setLoading(false);
      }
    };

    initCountries();
  }, [value, loadCountries]);

  // Smart filtering with fuzzy search
  const filteredCountries = searchTerm.trim()
    ? countries.filter(country => {
        const search = searchTerm.toLowerCase();
        const name = country.name.toLowerCase();
        const code = country.code.toLowerCase();
        
        return (
          name.includes(search) ||
          name.startsWith(search) ||
          code.includes(search) ||
          name.split(' ').some(word => word.startsWith(search))
        );
      })
    : countries;

  // Handle country selection with unified callback
  const handleSelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
    
    // Call onChange with all possible formats for backward compatibility
    onChange(country, country.name, country.code);
  }, [onChange]);

  // Handle clear selection
  const handleClear = useCallback(() => {
    setSelectedCountry(null);
    onChange(null, '', '');
  }, [onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCountries[highlightedIndex]) {
          handleSelect(filteredCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  }, [isOpen, filteredCountries, highlightedIndex, handleSelect]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Variant-specific styling
  const getVariantStyles = () => {
    const base = "w-full px-3 py-2 border rounded-lg transition-colors";
    
    if (variant === 'admin') {
      return `${base} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`;
    }
    
    // popup variant (default)
    return `${base} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`;
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className={`${getVariantStyles()} animate-pulse`}>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Field */}
      <div
        className={`
          ${getVariantStyles()}
          cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedCountry ? (
              <>
                {showFlag && selectedCountry.flag && (
                  <img
                    src={selectedCountry.flag}
                    alt={`${selectedCountry.name} flag`}
                    className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                    onError={(e) => {
                      // Fallback to emoji if flag image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                {showFlag && selectedCountry.emoji && !selectedCountry.flag && (
                  <span className="text-lg flex-shrink-0">{selectedCountry.emoji}</span>
                )}
                <span className="truncate text-gray-900 dark:text-gray-100">
                  {selectedCountry.name}
                  {showCode && ` (${selectedCountry.code})`}
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {selectedCountry && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm quốc gia..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>

            {/* Countries List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`
                      w-full px-3 py-2 text-left transition-colors flex items-center space-x-3
                      ${index === highlightedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/40'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    {showFlag && country.flag && (
                      <img
                        src={country.flag}
                        alt={`${country.name} flag`}
                        className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    {showFlag && country.emoji && !country.flag && (
                      <span className="text-lg flex-shrink-0">{country.emoji}</span>
                    )}
                    <span className={`flex-1 truncate ${
                      index === highlightedIndex
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {country.name}
                      {showCode && ` (${country.code})`}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Không tìm thấy quốc gia nào
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
