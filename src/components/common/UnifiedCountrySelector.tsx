import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInstantCountryData, isCountryDataReady, preloadCountryData } from '../../utils/admin/preloaders/country-preloader';

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
  { id: 'VN', name: 'Việt Nam', code: 'VN', emoji: '🇻🇳', flag: '/flag/VN.svg' },
  { id: 'US', name: 'United States', code: 'US', emoji: '🇺🇸', flag: '/flag/US.svg' },
  { id: 'SG', name: 'Singapore', code: 'SG', emoji: '🇸🇬', flag: '/flag/SG.svg' },
  { id: 'CA', name: 'Canada', code: 'CA', emoji: '🇨🇦', flag: '/flag/CA.svg' },
  { id: 'AU', name: 'Australia', code: 'AU', emoji: '🇦🇺', flag: '/flag/AU.svg' },
  { id: 'GB', name: 'United Kingdom', code: 'GB', emoji: '🇬🇧', flag: '/flag/GB.svg' },
  { id: 'DE', name: 'Germany', code: 'DE', emoji: '🇩🇪', flag: '/flag/DE.svg' },
  { id: 'FR', name: 'France', code: 'FR', emoji: '🇫🇷', flag: '/flag/FR.svg' },
  { id: 'JP', name: 'Japan', code: 'JP', emoji: '🇯🇵', flag: '/flag/JP.svg' },
  { id: 'KR', name: 'South Korea', code: 'KR', emoji: '🇰🇷', flag: '/flag/KR.svg' }
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

  // Optimized country loading using preloader
  const loadCountries = useCallback(async (): Promise<Country[]> => {
    // For popup variants, prioritize instant availability
    if (variant === 'popup') {
      // Check if data is already ready
      if (isCountryDataReady()) {
        console.log('🚀 UnifiedCountrySelector: Using preloaded data (instant)');
        return getInstantCountryData();
      }

      // Get instant data while ensuring background preload
      console.log('🚀 UnifiedCountrySelector: Using instant data + background preload');
      const instantData = getInstantCountryData();

      // Start background preload for next time
      preloadCountryData().catch(error => {
        console.warn('Background preload failed:', error);
      });

      return instantData;
    }

    // For admin variants, use full preload (less time-critical)
    console.log('🚀 UnifiedCountrySelector: Using full preload for admin variant');
    return preloadCountryData();
  }, [variant]);

  // Initialize countries on mount
  useEffect(() => {
    const initCountries = async () => {
      // For admin variant or when instant data is not available, show loading
      if (variant === 'admin' || !getInstantCountryData().length) {
        setLoading(true);
      }

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

    // For popup variant, set instant data immediately to avoid loading delay
    if (variant === 'popup') {
      const instantCountries = getInstantCountryData();
      setCountries(instantCountries);
      setLoading(false);

      // Find and set selected country from instant data
      if (value) {
        const found = instantCountries.find(c =>
          c.name.toLowerCase() === value.toLowerCase() ||
          c.code.toLowerCase() === value.toLowerCase()
        );
        setSelectedCountry(found || null);
      }

      // Background load for better data (non-blocking)
      loadCountries().then(loadedCountries => {
        setCountries(loadedCountries);

        // Update selected country with better data if needed
        if (value) {
          const found = loadedCountries.find(c =>
            c.name.toLowerCase() === value.toLowerCase() ||
            c.code.toLowerCase() === value.toLowerCase()
          );
          if (found && (!selectedCountry || found.code !== selectedCountry.code)) {
            setSelectedCountry(found);
          }
        }
      }).catch(() => {
        // Keep instant data on error
      });
    } else {
      // For admin variant, use normal loading
      initCountries();
    }
  }, [value, loadCountries, variant]);

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
            className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
            style={{
              // Ensure dropdown appears above other elements
              zIndex: 9999
            }}
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
