import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * @deprecated Use UnifiedCountrySelector instead for better performance and consistency
 * This component will be removed in a future version
 */

interface Country {
  name: string;
  code: string;
  emoji: string;
  unicode: string;
  image: string;
  dial_code: string;
}

interface CountrySelectorProps {
  value?: string;
  onChange: (country: Country | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showFlag?: boolean;
  showCode?: boolean;
}

export default function CountrySelector({
  value = '',
  onChange,
  placeholder = 'Chọn quốc gia',
  disabled = false,
  className = '',
  showFlag = true,
  showCode = false
}: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);

  // Load countries data
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/country.json');
        const data: Country[] = await response.json();
        setCountries(data);
        
        // Find selected country if value is provided
        if (value) {
          const found = data.find(country => 
            country.code === value || 
            country.name.toLowerCase() === value.toLowerCase()
          );
          setSelectedCountry(found || null);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, [value]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setDropdownPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle country selection
  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');
    onChange(country);
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedCountry(null);
    onChange(null);
  };

  // Get flag image URL
  const getFlagUrl = (countryCode: string) => {
    return `https://country-code-au6g.vercel.app/${countryCode}.svg`;
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative country-selector ${className}`} ref={containerRef}>
      {/* Input Field */}
      <div
        className={`
          w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
          cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          ${isOpen ? 'ring-2 ring-primary-500 border-transparent' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedCountry ? (
              <>
                {showFlag && (
                  <img
                    src={getFlagUrl(selectedCountry.code)}
                    alt={`${selectedCountry.name} flag`}
                    className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                    onError={(e) => {
                      // Fallback to emoji if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                )}
                <span className="hidden text-sm">{selectedCountry.emoji}</span>
                <span className="truncate">
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
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
        {isOpen && !disabled && dropdownPosition && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[60] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm quốc gia..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Countries List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    type="button"
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center space-x-3"
                  >
                    {showFlag && (
                      <img
                        src={getFlagUrl(country.code)}
                        alt={`${country.name} flag`}
                        className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                        onError={(e) => {
                          // Fallback to emoji if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    )}
                    <span className="hidden text-sm">{country.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {country.name}
                      </div>
                      {showCode && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {country.code}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
